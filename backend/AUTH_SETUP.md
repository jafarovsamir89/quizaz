# Firebase Authentication Setup

Bilik Arena uses Firebase Auth for secure, production-grade identity management.

## 1. Firebase Project Setup
1. Go to [Firebase Console](https://console.firebase.google.com/).
2. Create a new project named `bilik-arena`.
3. Enable **Authentication**:
   - Go to Build > Authentication.
   - Enable **Google** as a sign-in provider.
   - Enable **Anonymous** sign-in (for Guest Mode).

## 2. Service Account Credentials
1. Go to Project Settings > **Service accounts**.
2. Click **Generate new private key**.
3. Save the JSON file. You will need values from it for the `.env` file.

## 3. **Environment Variables**
Add the following to your `backend/.env`:

```env
FIREBASE_PROJECT_ID="your-project-id"
FIREBASE_CLIENT_EMAIL="your-client-email"
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```
*Note: Ensure the private key includes the `\n` characters if they are in the JSON file.*

## 4. Auth Flow & Account Merging

### Guest → Google Flow
To preserve progress when a Guest decides to sign in with Google:
1. **Frontend**: Use Firebase's `linkWithCredential` method. This links the Google identity to the existing Anonymous `firebaseUid`.
2. **Backend**: When the user calls `POST /auth/sync` with the new Google-linked token:
   - The `firebaseUid` remains the same.
   - Backend detects the `sign_in_provider` has changed to `google.com`.
   - Backend updates the existing profile with `email`, `googleId`, and `avatarUrl`.
   - **Result**: All `coins`, `xp`, `city`, and `game_sessions` are preserved.

*Note: If the user signs into Google as a fresh user without linking, Firebase will issue a DIFFERENT `firebaseUid`, creating a separate account.*

## 5. Security Roles
- **Guest**: Can play random questions and view metadata.
- **User (Google)**: Same as guest, but progress is persistent across devices.
- **Admin**: Can access `/admin/*` routes and Question CRUD.
  - To make a user an Admin, set `isAdmin = true` in the PostgreSQL database for that `firebaseUid`.

## 6. Testing with Curl
**Sync User:**
```bash
curl -X POST http://localhost:3000/auth/sync \
     -H "Content-Type: application/json" \
     -d '{"token": "PASTE_FIREBASE_ID_TOKEN_HERE"}'
```

**Get My Profile:**
```bash
curl -H "Authorization: Bearer <TOKEN>" http://localhost:3000/profile/me
```
