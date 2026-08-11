import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import sensiblePlugin from '../../app/plugins/sensible';
import jwtPlugin from '../../app/plugins/jwt';
import authPlugin from '../../app/plugins/auth';
import registerRoute from '../users/register';
import loginRoute from '../users/login';
import ticketsRoute from './tickets';
import commentsRoute from './comments';
import { db, users, tickets, ticketComments } from '@fastify-ticket-system/db';
import { eq } from 'drizzle-orm';

async function buildApp() {
  const app = Fastify();
  await app.register(sensiblePlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await app.register(registerRoute, { prefix: '/users' });
  await app.register(loginRoute, { prefix: '/users' });
  await app.register(ticketsRoute, { prefix: '/tickets' });
  await app.register(commentsRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

describe('/tickets/:id/comments', () => {
  const testEmail = 'vitest-comments@ticketsystem.test';
  const testPassword = 'testpassword123';
  let token: string;
  let userId: number;
  let ticketId: number;
  const testSubject = 'Vitest test ticket - comments';

  beforeAll(async () => {
    const app = await buildApp();

    const registerResponse = await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: testPassword,
        name: 'Vitest Comments User',
      },
    });
    userId = registerResponse.json().id;

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: { email: testEmail, password: testPassword },
    });
    token = loginResponse.json().token;

    const createResponse = await app.inject({
      method: 'POST',
      url: '/tickets',
      headers: { authorization: `Bearer ${token}` },
      payload: {
        subject: testSubject,
        description: 'For comment tests',
        requesterName: 'Test Requester',
        requesterEmail: 'requester@example.com',
      },
    });
    ticketId = createResponse.json().id;

    await app.close();
  });

  afterAll(async () => {
    await db.delete(ticketComments).where(eq(ticketComments.ticketId, ticketId));
    await db.delete(tickets).where(eq(tickets.subject, testSubject));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('POST /tickets/:id/comments', () => {
    it('creates a comment tied to the logged-in user', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: `/tickets/${ticketId}/comments`,
        headers: { authorization: `Bearer ${token}` },
        payload: { body: 'Test comment body' },
      });

      expect(response.statusCode).toBe(201);
      const body = response.json();
      expect(body.body).toBe('Test comment body');
      expect(body.authorId).toBe(userId);
      expect(body.ticketId).toBe(ticketId);

      await app.close();
    });

    it('returns 404 for a comment on a nonexistent ticket', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: '/tickets/999999/comments',
        headers: { authorization: `Bearer ${token}` },
        payload: { body: 'Should fail' },
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });

    it('rejects an empty comment body', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'POST',
        url: `/tickets/${ticketId}/comments`,
        headers: { authorization: `Bearer ${token}` },
        payload: { body: '' },
      });

      expect(response.statusCode).toBe(400);

      await app.close();
    });
  });

  describe('GET /tickets/:id/comments', () => {
    it('lists comments for a ticket', async () => {
      const app = await buildApp();

      await app.inject({
        method: 'POST',
        url: `/tickets/${ticketId}/comments`,
        headers: { authorization: `Bearer ${token}` },
        payload: { body: 'Another comment' },
      });

      const response = await app.inject({
        method: 'GET',
        url: `/tickets/${ticketId}/comments`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(Array.isArray(body)).toBe(true);
      expect(body.length).toBeGreaterThanOrEqual(1);

      await app.close();
    });
  });
});