import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import Fastify from 'fastify';
import sensiblePlugin from '../../app/plugins/sensible';
import jwtPlugin from '../../app/plugins/jwt';
import authPlugin from '../../app/plugins/auth';
import registerRoute from './register';
import loginRoute from './login';
import { db, users } from '@fastify-ticket-system/db';
import { eq } from 'drizzle-orm';

async function buildApp() {
  const app = Fastify();
  await app.register(sensiblePlugin);
  await app.register(jwtPlugin);
  await app.register(authPlugin);
  await app.register(registerRoute, { prefix: '/users' });
  await app.register(loginRoute, { prefix: '/users' });
  await app.ready();
  return app;
}

describe('POST /users/login', () => {
  const testEmail = 'vitest-login@ticketsystem.test';
  const testPassword = 'testpassword123';

  beforeAll(async () => {
    const app = await buildApp();
    await app.inject({
      method: 'POST',
      url: '/users/register',
      payload: {
        email: testEmail,
        password: testPassword,
        name: 'Vitest Login User',
      },
    });
    await app.close();
  });

  afterAll(async () => {
    await db.delete(users).where(eq(users.email, testEmail));
  });

  it('logs in with correct credentials and returns a token', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: {
        email: testEmail,
        password: testPassword,
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(typeof body.token).toBe('string');

    await app.close();
  });

  it('rejects an incorrect password with 401', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: {
        email: testEmail,
        password: 'wrongpassword',
      },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });

  it('rejects a nonexistent email with 401', async () => {
    const app = await buildApp();

    const response = await app.inject({
      method: 'POST',
      url: '/users/login',
      payload: {
        email: 'does-not-exist@ticketsystem.test',
        password: testPassword,
      },
    });

    expect(response.statusCode).toBe(401);

    await app.close();
  });
});