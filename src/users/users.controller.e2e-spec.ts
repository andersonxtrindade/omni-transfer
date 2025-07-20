import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import { getDataSourceToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';

describe('UserController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    jwtService = moduleFixture.get(JwtService);
    dataSource = moduleFixture.get<DataSource>(getDataSourceToken('omni'));
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM users WHERE username IN (?, ?)`, ['john', 'duplicateUser']);
    }
    try {
      if (dataSource) {
        await dataSource.destroy();
      }
    } catch (err) {
      console.error('Erro ao destruir dataSource:', err);
    }

    try {
      if (app) {
        await app.close();
      }
    } catch (err) { }
  });

  describe('/users/signup (POST)', () => {
    it(' - success', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          username: 'john',
          password: '123456',
          birthdate: '2000-01-01',
        })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
      });

      const user = await dataSource.query(`SELECT * FROM users WHERE username = ?`, ['john']);
      expect(user).toHaveLength(1);
    });

    it(' - conflict (duplicate username)', async () => {
      await dataSource.query(
        `INSERT INTO users (id, username, password, birthdate, balance, createdAt, updatedAt)
       VALUES ('999555', 'duplicateUser', 'hashed', '2000-01-01', 0, datetime('now'), datetime('now'))`
      );

      const response = await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          username: 'duplicateUser',
          password: 'any777',
          birthdate: '2000-01-01',
        })
        .expect(409);

      expect(response.body.message).toMatch(/already exists/i);
    });

    it(' - validation error', async () => {
      const response = await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          username: '',
          password: '',
          birthdate: 'invalid-date',
        })
        .expect(400);

      expect(response.body.message).toBeInstanceOf(Array);
      expect(response.body.message.length).toBeGreaterThan(0);
    });
  });

  describe('/users (GET)', () => {
    let token: string;
    let userId: string;

    beforeAll(async () => {
      const res = await request(app.getHttpServer())
        .post('/users/signup')
        .send({
          username: 'john',
          password: '123456',
          birthdate: '2000-01-01',
        });

      userId = res.body.id;

      token = jwtService.sign({ sub: userId });
    });

    it('should return list of users', async () => {
      const res = await request(app.getHttpServer())
        .get('/users')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0]).toHaveProperty('id');
      expect(res.body[0]).toHaveProperty('username');
    });
  });

});