# 🚀 Bilik Arena Pre-Deployment Notes

These notes outline the current state of the MVP and what needs to be addressed before moving to a real production environment.

## ⚠️ Current Limitations
1. **Local Infrastructure**: Backend and Database are running locally. For production, we need a VPS (DigitalOcean/AWS) and a managed DB.
2. **Security**:
   - `JWT_SECRET` and `DATABASE_URL` must be moved to secure environment variables (Secrets Manager).
   - Firebase Client configuration is currently in `.env`.
3. **Analytics**: Only a placeholder wrapper is implemented. Real Firebase Analytics or Google Analytics 4 must be connected.
4. **Performance**: 
   - PostgreSQL indices are added, but real-world load testing is required.
   - Images/Icons should be moved to a CDN (Cloudflare/AWS S3).
5. **Real-time**: No Socket.io yet. Duels are purely asynchronous (refresh-based).
6. **Payments**: Shop and Wallet currently use "soft currency" (earned coins). No real money integration yet.

## 🛠 Required Production Steps
- [ ] Setup SSL/HTTPS (Nginx + Certbot).
- [ ] Configure production Firebase project (different from dev).
- [ ] Setup Sentry or similar for error tracking.
- [ ] Implement CI/CD pipeline (GitHub Actions).
- [ ] Minify and optimize frontend bundle (`npm run build`).

## 📱 Mobile Native
- The current version is a **PWA**.
- To reach App Store/Google Play, we should consider wrapping this in **Capacitor** or **React Native WebView**.
