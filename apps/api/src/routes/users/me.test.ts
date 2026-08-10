import { describe, it, expect, beforeAll, afterAll } from 'vitest';
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

describe('GET /users/me', () => {
  const testEmail = 'vitest-me@ticketsystem.test';
  const testPassword = 'testpassword123';
  let token: string;

  beforeAll(async () => {
    const app = await buildApp();

    await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: testPassword,
        name: 'Vitest Me User',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    token = loginResponse.json().token;

    await app.close();
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('rejects a request with no token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('rejects a request with an invalid token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: 'Bearer not-a-real-token',
      },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('returns the current user with a valid token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'GET',
      url: '/users/me',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.email).toBe(testEmail);
    expect(body.name).toBe('Vitest Me User');

    await app.close();
  });
});