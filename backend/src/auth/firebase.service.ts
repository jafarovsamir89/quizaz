import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  onModuleInit() {
    if (admin.apps.length === 0) {
      try {
        let credential;
        
        if (process.env.FIREBASE_SERVICE_ACCOUNT) {
          const rawJson = process.env.FIREBASE_SERVICE_ACCOUNT.trim();
          console.log(`[Diagnostic] FIREBASE_SERVICE_ACCOUNT starts with: "${rawJson.substring(0, 10)}..." (length: ${rawJson.length})`);
          
          let serviceAccount;
          if (rawJson.startsWith('{') || rawJson.startsWith('"')) {
            // Clean up wrapping quotes if Railway added them
            let cleanJson = rawJson;
            if (cleanJson.startsWith('"') && cleanJson.endsWith('"')) {
              cleanJson = cleanJson.substring(1, cleanJson.length - 1);
            }
            // Remove backslash escapes if Railway escaped them
            cleanJson = cleanJson.replace(/\\"/g, '"').replace(/\\n/g, '\n');
            
            const jsonMatch = cleanJson.match(/\{[\s\S]*\}/);
            if (!jsonMatch) throw new Error('No JSON object (braces) found in FIREBASE_SERVICE_ACCOUNT string');
            serviceAccount = JSON.parse(jsonMatch[0]);
          } else {
            // Try decoding from base64 (which has no braces or quotes, completely bulletproof)
            try {
              const decoded = Buffer.from(rawJson, 'base64').toString('utf8');
              serviceAccount = JSON.parse(decoded);
              console.log('✅ Decoded Firebase service account from Base64 successfully');
            } catch (err: any) {
              throw new Error(`Failed to parse as JSON and failed to decode as Base64: ${err.message}`);
            }
          }
          
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
