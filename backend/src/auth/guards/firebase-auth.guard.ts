import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from '../firebase.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class FirebaseAuthGuard implements CanActivate {
  constructor(
    private firebase: FirebaseService,
    private users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('No token provided');
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await this.firebase.verifyToken(token);

    if (!decodedToken) {
      throw new UnauthorizedException('Invalid token');
    }

    const user = await this.users.findByFirebaseUid(decodedToken.uid);
    if (!user) {
      throw new UnauthorizedException('User not synchronized');
    }

    request.user = user;
    return true;
  }
}
