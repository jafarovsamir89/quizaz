import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

@Injectable()
export class AuthMockGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    // Simulate a user if specifically requested in tests via header or similar
    // Or just always inject a mock user for E2E
    request.user = {
      id: 'test-user-id',
      firebaseUid: 'test-firebase-uid',
      email: 'test@example.com',
      role: 'USER', // Default role
    };
    return true;
  }
}

@Injectable()
export class AdminMockGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    request.user = {
      id: 'test-admin-id',
      firebaseUid: 'test-admin-uid',
      email: 'admin@example.com',
      role: 'ADMIN',
    };
    return true;
  }
}
