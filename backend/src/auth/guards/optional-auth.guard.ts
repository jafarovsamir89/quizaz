import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { FirebaseService } from '../firebase.service';
import { UsersService } from '../../users/users.service';

@Injectable()
export class OptionalAuthGuard implements CanActivate {
  constructor(
    private firebase: FirebaseService,
    private users: UsersService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split('Bearer ')[1];
      const decodedToken = await this.firebase.verifyToken(token);
      
      if (decodedToken) {
        const user = await this.users.findByFirebaseUid(decodedToken.uid);
        if (user) {
          request.user = user;
        }
      }
    }
    
    return true;
  }
}
