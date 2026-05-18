import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { DuelsService } from './duels.service';
import { Injectable, Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'duels',
})
@Injectable()
export class DuelsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(DuelsGateway.name);
  private activeClients = new Map<string, Socket>(); // userId -> Socket
  private lobbyQueue: string[] = []; // Array of userIds waiting for a real-time matchup

  constructor(private readonly duelsService: DuelsService) {}

  handleConnection(client: Socket) {
    const userId = client.handshake.query.userId as string;
    if (userId) {
      this.activeClients.set(userId, client);
      this.logger.log(`User connected to Duels: ${userId} (${client.id})`);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = Array.from(this.activeClients.keys()).find(
      (key) => this.activeClients.get(key)?.id === client.id,
    );
    if (userId) {
      this.activeClients.delete(userId);
      this.lobbyQueue = this.lobbyQueue.filter((id) => id !== userId);
      this.logger.log(`User disconnected from Duels: ${userId}`);
    }
  }

  @SubscribeMessage('join_lobby')
  async handleJoinLobby(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ) {
    const { userId } = data;
    if (!userId) return;

    // Check if already in queue
    if (this.lobbyQueue.includes(userId)) {
      client.emit('queue_status', { status: 'waiting' });
      return;
    }

    this.logger.log(`User ${userId} joined the real-time PvP lobby queue`);

    // Matchmaking logic
    if (this.lobbyQueue.length > 0) {
      const opponentId = this.lobbyQueue.shift()!;
      this.logger.log(`Matchmaking success! ${userId} vs ${opponentId}`);

      try {
        // Trigger atomic creation/joining in service
        // Let's have first initiator start a duel, then opponent joins
        const duelForInitiator = await this.duelsService.findOrCreate(opponentId);
        const duelForOpponent = await this.duelsService.findOrCreate(userId);

        const opponentSocket = this.activeClients.get(opponentId);

        // Notify both clients of the successful match and supply duel details!
        if (opponentSocket) {
          opponentSocket.emit('duel_matched', {
            duelId: duelForInitiator.duelId,
            opponentId: userId,
            duel: duelForInitiator,
          });
        }
        client.emit('duel_matched', {
          duelId: duelForInitiator.duelId,
          opponentId: opponentId,
          duel: duelForOpponent,
        });
      } catch (err: any) {
        this.logger.error(`Failed to pair duel: ${err.message}`);
        client.emit('matchmaking_error', { message: 'Xəta baş verdi' });
      }
    } else {
      this.lobbyQueue.push(userId);
      client.emit('queue_status', { status: 'waiting' });
    }
  }

  @SubscribeMessage('leave_lobby')
  handleLeaveLobby(@MessageBody() data: { userId: string }) {
    this.lobbyQueue = this.lobbyQueue.filter((id) => id !== data.userId);
    this.logger.log(`User ${data.userId} left the real-time PvP lobby queue`);
  }

  @SubscribeMessage('submit_live_answer')
  async handleLiveAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { duelId: string; userId: string; questionId: number; selectedOption: string; timeSpentMs: number },
  ) {
    try {
      const duelResult = await this.duelsService.submitAnswer(
        data.userId,
        data.duelId,
        data.questionId,
        data.selectedOption,
        data.timeSpentMs,
      );

      // Broadcast answer notification to the opponent
      const duel = await this.duelsService.getDuel(data.duelId);
      if (!duel) return;

      const isInitiator = duel.initiatorId === data.userId;
      const opponentId = isInitiator ? duel.opponentId : duel.initiatorId;

      if (opponentId) {
        const opponentSocket = this.activeClients.get(opponentId);
        if (opponentSocket) {
          opponentSocket.emit('opponent_answered', {
            questionId: data.questionId,
            selectedOption: data.selectedOption,
            duel,
          });
        }
      }

      client.emit('answer_result', { status: 'ok', duelResult, duel });
    } catch (err: any) {
      client.emit('error', { message: err.message });
    }
  }
}
