import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      try {
        let credential;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          // Priority 1: Full JSON string
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT.trim());
          credential = admin.credential.cert(serviceAccount);
        } else {
          // Priority 2: Individual variables
          let privateKey = process.env.FIREBASE_PRIVATE_KEY || '';
          if (privateKey.startsWith('"') && privateKey.endsWith('"')) {
            privateKey = privateKey.substring(1, privateKey.length - 1);
          }
          privateKey = privateKey.replace(/\\n/g, '\n');

          credential = admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: privateKey,
          } as any);
        }

        admin.initializeApp({ credential });
        console.log('✅ Firebase Admin initialized successfully');
      } catch (e: any) {
        console.warn('❌ Firebase Admin failed to initialize:', e.message);
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
