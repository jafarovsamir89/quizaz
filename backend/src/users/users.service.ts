import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findByFirebaseUid(firebaseUid: string) {
    return this.prisma.user.findUnique({
      where: { firebaseUid },
      include: { city: true },
    });
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async create(data: {
    firebaseUid: string;
    email?: string;
    nickname: string;
    avatarUrl?: string;
    googleId?: string;
  }) {
    return this.prisma.user.create({
      data,
      include: { city: true },
    });
  }

  async update(id: string, data: any) {
    // Prevent sensitive fields from being updated via standard update
    const { balanceCoins, xp, isAdmin, ...safeData } = data;
    return this.prisma.user.update({
      where: { id },
      data: safeData,
    });
  }

  async mergeGuestToGoogle(guestId: string, googleData: any) {
    // Logic: If guest exists, update it with Google data (effectively promoting guest to Google user)
    // If a Google user already exists with that email, we might need a more complex merge strategy
    // For MVP: We assume the client handles the prompt and we just promote the guest.
    return this.prisma.user.update({
      where: { id: guestId },
      data: {
        email: googleData.email,
        googleId: googleData.googleId,
        avatarUrl: googleData.avatarUrl || undefined,
        // keep coins, xp, etc.
      },
      include: { city: true },
    });
  }
}
