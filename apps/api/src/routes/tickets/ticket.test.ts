import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import sensiblePlugin from '../../app/plugins/sensible';
import jwtPlugin from '../../app/plugins/jwt';
import authPlugin from '../../app/plugins/auth';
import registerRoute from '../users/register';
import loginRoute from '../users/login';
import ticketsRoute from './tickets';
import ticketRoute from './ticket';
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
  await app.register(ticketRoute, { prefix: '/tickets' });
  await app.ready();
  return app;
}

describe('/tickets/:id', () => {
  const testEmail = 'vitest-ticket-detail@ticketsystem.test';
  const testPassword = 'testpassword123';
  let token: string;
  let ticketId: number;
  const testSubject = 'Vitest test ticket - detail/update';

  beforeAll(async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: testPassword,
        name: 'Vitest Ticket Detail User',
      },
    });

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
        description: 'For detail/update tests',
        requesterName: 'Test Requester',
        requesterEmail: 'requester@example.com',
      },
    });
    ticketId = createResponse.json().id;

    await app.close();
  });

  afterAll(async () => {
    await db.delete(tickets).where(eq(tickets.subject, testSubject));
    await db.delete(users).where(eq(users.email, testEmail));
  });

  describe('GET /tickets/:id', () => {
    it('returns the ticket', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'GET',
        url: `/tickets/${ticketId}`,
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(200);
      expect(response.json().subject).toBe(testSubject);

      await app.close();
    });

    it('returns 404 for a nonexistent ticket', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'GET',
        url: '/tickets/999999',
        headers: { authorization: `Bearer ${token}` },
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });

  describe('PATCH /tickets/:id', () => {
    it('updates the ticket status', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'PATCH',
        url: `/tickets/${ticketId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: { status: 'in_progress' },
      });

      expect(response.statusCode).toBe(200);
      const body = response.json();
      expect(body.status).toBe('in_progress');

      await app.close();
    });

    it('rejects an empty update body', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'PATCH',
        url: `/tickets/${ticketId}`,
        headers: { authorization: `Bearer ${token}` },
        payload: {},
      });

      expect(response.statusCode).toBe(400);

      await app.close();
    });

    it('returns 404 when updating a nonexistent ticket', async () => {
      const app = await buildApp();

      const response = await app.inject({
        method: 'PATCH',
        url: '/tickets/999999',
        headers: { authorization: `Bearer ${token}` },
        payload: { status: 'closed' },
      });

      expect(response.statusCode).toBe(404);

      await app.close();
    });
  });
});