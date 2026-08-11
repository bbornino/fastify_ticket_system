import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import sensiblePlugin from '../../app/plugins/sensible';
import jwtPlugin from '../../app/plugins/jwt';
import authPlugin from '../../app/plugins/auth';
import registerRoute from '../users/register';
import loginRoute from '../users/login';
import ticketsRoute from './tickets';
import { db, users, tickets } from '@fastify-ticket-system/db';
import { eq } from 'drizzle-orm';

async function buildApp() {
  const app = Fastify();
  await app.register(sensiblePlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await app.register(registerRoute, { prefix: '/users' });
  await app.register(loginRoute, { prefix: '/users' });
  await app.register(ticketsRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

describe('/tickets', () => {
  const testEmail = 'vitest-tickets@ticketsystem.test';
  const testPassword = 'testpassword123';
  let token: string;
  const createdTicketSubjects: string[] = [];

  beforeAll(async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: testPassword,
        name: 'Vitest Tickets User',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: { email: testEmail, password: testPassword },
    });

    token = loginResponse.json().token;

    await app.close();
  });

  afterAll(async () => {
    for (const subject of createdTicketSubjects) {
      await db.delete(tickets).where(eq(tickets.subject, subject));
    }
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('POST /tickets', () => {
    it('creates a ticket and returns 201', async () => {
      const app = await buildApp();
      const subject = 'Vitest test ticket - creation';
      createdTicketSubjects.push(subject);

      const response = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          subject,
          description: 'Something is broken',
          priority: 'high',
          requesterName: 'Test Requester',
          requesterEmail: 'requester@example.com',
        },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.subject).toBe(subject);
      expect(body.status).toBe('open');
      expect(body.priority).toBe('high');

      await app.close();
    });

    it('rejects a request with no auth token', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: '/tickets',
        payload: {
          subject: 'Should fail',
          description: 'No auth',
          requesterName: 'Test',
          requesterEmail: 'test@example.com',
        },
      });

      expect(response.statusCode).toBe(401);

      await app.close();
    });

    it('rejects a request missing required fields', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          subject: 'Missing fields',
        },
      });

      expect(response.statusCode).toBe(400);

      await app.close();
    });
  });

  describe('GET /tickets', () => {
    it('lists tickets', async () => {
      const app = await buildApp();
      const subject = 'Vitest test ticket - listing';
      createdTicketSubjects.push(subject);

      await app.inject({
        method: 'POST',
        url: '/tickets',
        headers: { authorization: `Bearer ${token}` },
        payload: {
          subject,
          description: 'For list test',
          requesterName: 'Test Requester',
          requesterEmail: 'requester@example.com',
        },
      });

      const response = await app.inject({
        method: 'GET',
        url: '/tickets',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.some((t: { subject: string }) => t.subject === subject)).toBe(
        true
      );

      await app.close();
    });

    it('filters tickets by status', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/tickets?status=open',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(
        body.every((t: { status: string }) => t.status === 'open')
      ).toBe(true);

      await app.close();
    });
  });
});