import { Module, Global } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { FirebaseService } from './firebase.service';
import { UsersModule } from '../users/users.module';
import { FirebaseAuthGuard } from './guards/firebase-auth.guard';
import { AdminGuard } from './guards/admin.guard';
import { OptionalAuthGuard } from './guards/optional-auth.guard';

@Global()
@Module({
  imports: [UsersModule],
  controllers: [AuthController],
  providers: [AuthService, FirebaseService, FirebaseAuthGuard, AdminGuard, OptionalAuthGuard],
  exports: [AuthService, FirebaseService, FirebaseAuthGuard, AdminGuard, OptionalAuthGuard],
})
export class AuthModule {}
