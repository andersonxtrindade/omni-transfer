import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../../src/app.module';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { getDataSourceToken } from '@nestjs/typeorm';
import { JwtService } from '@nestjs/jwt';
import { v4 as uuidv4 } from 'uuid';

describe('TransfersController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;
  let jwtService: JwtService;
  let token: string;
  let fromId: string;
  let toId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    dataSource = moduleFixture.get(getDataSourceToken('omni'));
    jwtService = moduleFixture.get(JwtService);

    const hashedPassword = await bcrypt.hash('123', 10);

    fromId = uuidv4();
    toId = uuidv4();

    await dataSource.query(
      `INSERT INTO users (id, username, password, birthdate, balance, createdAt, updatedAt)
       VALUES (?, 'sender', ?, '1990-01-01', 500, datetime('now'), datetime('now'))`,
      [fromId, hashedPassword],
    );

    await dataSource.query(
      `INSERT INTO users (id, username, password, birthdate, balance, createdAt, updatedAt)
       VALUES (?, 'receiver', ?, '1990-01-01', 100, datetime('now'), datetime('now'))`,
      [toId, hashedPassword],
    );

    token = jwtService.sign({ sub: fromId });
  });

  afterAll(async () => {
    await dataSource.query(`DELETE FROM transfer`);
    await dataSource.query(`DELETE FROM users WHERE username IN ('sender', 'receiver')`);

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

  it('/transfer (POST) - success', async () => {
    await request(app.getHttpServer())
      .post('/transfer')
      .set('Authorization', `Bearer ${token}`)
      .send({ fromId, toId, amount: 50 })
      .expect(204);

    const [sender] = await dataSource.query(`SELECT balance FROM users WHERE id = ?`, [fromId]);
    const [receiver] = await dataSource.query(`SELECT balance FROM users WHERE id = ?`, [toId]);

    expect(Number(sender.balance)).toBe(450);
    expect(Number(receiver.balance)).toBe(150);
  });
});
