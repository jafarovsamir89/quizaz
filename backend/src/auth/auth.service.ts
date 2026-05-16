import { Injectable, UnauthorizedException } from '@nestjs/common';
import { FirebaseService } from './firebase.service';
import { UsersService } from '../users/users.service';

@Injectable()
export class AuthService {
  constructor(
    private firebase: FirebaseService,
    private users: UsersService,
  ) {}

  async syncUser(token: string) {
    const decodedToken = await this.firebase.verifyToken(token);
    if (!decodedToken) {
      throw new UnauthorizedException('Invalid Firebase token');
    }

    let user = await this.users.findByFirebaseUid(decodedToken.uid);

    if (!user) {
      // New user (Guest or Google)
      // sign_in_provider can be 'anonymous', 'google.com', etc.
      const nickname = decodedToken.name || `Player${Math.floor(Math.random() * 9000) + 1000}`;
      
      user = await this.users.create({
        firebaseUid: decodedToken.uid,
        email: decodedToken.email,
        nickname: nickname,
        avatarUrl: decodedToken.picture,
        googleId: decodedToken.firebase.sign_in_provider === 'google.com' ? decodedToken.uid : undefined,
      });
    } else {
      // User exists. Check if we need to link/merge (e.g. guest became Google)
      const isGoogle = decodedToken.firebase.sign_in_provider === 'google.com';
      if (isGoogle && !user.googleId) {
        user = await this.users.mergeGuestToGoogle(user.id, {
          email: decodedToken.email,
          googleId: decodedToken.uid,
          avatarUrl: decodedToken.picture,
        });
      }
    }

    return user;
  }
}
