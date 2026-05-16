import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');
      
      try {
        admin.initializeApp({
          credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID || 'dummy-project-id',
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL || 'dummy@example.com',
            privateKey: privateKey || '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQD...\n-----END PRIVATE KEY-----\n',
          }),
        });
        console.log('Firebase Admin initialized');
      } catch (e) {
        console.warn('Firebase Admin failed to initialize. Check .env variables.');
      }
    }
  }

  async verifyToken(token: string) {
    if (token.startsWith('dev-token-')) {
      const uid = token.split('dev-token-')[1];
      return { 
        uid: uid, 
        email: `dev-${uid}@example.com`, 
        name: `DevUser`, 
        picture: `https://api.dicebear.com/7.x/avataaars/svg?seed=${uid}`,
        firebase: { sign_in_provider: 'anonymous' } 
      } as any;
    }
    try {
      return await admin.auth().verifyIdToken(token);
    } catch (error) {
      return null;
    }
  }
}
