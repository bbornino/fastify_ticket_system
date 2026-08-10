import { describe, it, expect, afterAll } from 'vitest';
import Fastify from 'fastify';
import sensiblePlugin from '../../app/plugins/sensible';
import jwtPlugin from '../../app/plugins/jwt';
import authPlugin from '../../app/plugins/auth';
import registerRoute from './register';
import loginRoute from './login';
import meRoute from './me';
import { db, users } from '@fastify-ticket-system/db';
import { eq } from 'drizzle-orm';

async function buildApp() {
  const app = Fastify();
  await app.register(sensiblePlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await app.register(registerRoute, { prefix: '/users' });
  await app.register(loginRoute, { prefix: '/users' });
  await app.register(meRoute, { prefix: '/users' });
  await app.ready();
  return app;
}

describe('POST /users/register', () => {
  const testEmail = 'vitest-register@ticketsystem.test';

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('creates a new user and returns 201', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: 'testpassword123',
        name: 'Vitest User',
      },
    });

    expect(response.statusCode).toBe(201);
    const body = response.json();
    expect(body.email).toBe(testEmail);
    expect(body.name).toBe('Vitest User');
    expect(body.role).toBe('agent');
    expect(body.passwordHash).toBeUndefined();

    await app.close();
  });

  it('rejects a duplicate email with 409', async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: 'testpassword123',
        name: 'Vitest User',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: 'differentpassword',
        name: 'Someone Else',
      },
    });

    expect(response.statusCode).toBe(409);
  });

  it('rejects an invalid email with 400', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: 'not-an-email',
        password: 'testpassword123',
        name: 'Vitest User',
      },
    });

    expect(response.statusCode).toBe(400);

    await app.close();
  });
});