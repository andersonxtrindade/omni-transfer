import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    dataSource = moduleFixture.get(getDataSourceToken('omni'));

    const hashedPassword = await bcrypt.hash('password', 10);
    await dataSource.query(
      `INSERT INTO users (id, username, password, birthdate, balance, createdAt, updatedAt)
       VALUES ('999555', ?, ?, ?, ?, datetime('now'), datetime('now'))`,
      ['testuser', hashedPassword, '1990-01-01', 1000]
    );
  });

  afterAll(async () => {
    if (dataSource?.isInitialized) {
      await dataSource.query(`DELETE FROM users WHERE username = ?`, ['testuser']);
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

  describe('/users/signin (POST)', () => {
    it(' - success', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'password',
      };

      const response = await request(app.getHttpServer())
        .post('/users/signin')
        .send(loginDto)
        .expect(200);

      expect(response.body).toHaveProperty('access_token');
      expect(response.body).toHaveProperty('expiresIn');
    });

    it('/users/signin (POST) - fail with wrong password', async () => {
      const loginDto = {
        username: 'testuser',
        password: 'wrong-password',
      };

      const response = await request(app.getHttpServer())
        .post('/users/signin')
        .send(loginDto)
        .expect(401);

      expect(response.body.message).toMatch(/invalid credentials/i);
    });
  })
});
