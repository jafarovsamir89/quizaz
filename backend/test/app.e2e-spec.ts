import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { FirebaseService } from './../src/auth/firebase.service';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Bilik Arena Smoke Tests (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(FirebaseService)
      .useValue({
        onModuleInit: jest.fn(),
        verifyToken: jest.fn().mockResolvedValue({ uid: 'test-uid' }),
      })
      .overrideProvider(PrismaService)
      .useValue({
        onModuleInit: jest.fn(),
        city: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, nameAz: 'Bakı' }]),
        },
        category: {
          findMany: jest.fn().mockResolvedValue([{ id: 1, nameAz: 'Tarix' }]),
        },
        $queryRaw: jest.fn().mockResolvedValue([]),
        $queryRawUnsafe: jest.fn().mockResolvedValue([]),
        question: {
          findMany: jest.fn().mockResolvedValue([]),
          findUnique: jest.fn().mockResolvedValue(null),
        },
      })
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  describe('Public Endpoints', () => {
    it('/health (GET) should return ok', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body.status).toBe('ok');
          expect(res.body.timestamp).toBeDefined();
        });
    });

    it('/cities (GET) should return list of cities', () => {
      return request(app.getHttpServer())
        .get('/cities')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('nameAz');
          }
        });
    });

    it('/categories (GET) should return list of categories', () => {
      return request(app.getHttpServer())
        .get('/categories')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          if (res.body.length > 0) {
            expect(res.body[0]).toHaveProperty('nameAz');
          }
        });
    });

    it('/leaderboards/cities (GET) should return ranking', () => {
      return request(app.getHttpServer())
        .get('/leaderboards/cities')
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body.items)).toBe(true);
        });
    });
  });

  describe('Security & Protection', () => {
    it('/questions/random (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/questions/random')
        .expect(401);
    });

    it('/questions (GET) admin endpoint should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/questions')
        .expect(401);
    });

    it('/leaderboards/me (GET) should return 401 without token', () => {
      return request(app.getHttpServer())
        .get('/leaderboards/me')
        .expect(401);
    });
  });

  describe('Authenticated Flow Mocking (Example)', () => {
    // Note: To test these, we would use moduleFixture.overrideGuard(FirebaseAuthGuard).useValue(new AuthMockGuard())
    // For now, we skip fully authenticated E2E flows in basic smoke tests.
    it.todo('Implementation of authenticated duel flow with AuthMockGuard');
    it.todo('Implementation of wallet transaction flow with AuthMockGuard');
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });
});
