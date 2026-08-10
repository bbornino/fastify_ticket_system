import { FastifyInstance } from 'fastify';
import fp from 'fastify-plugin';
import jwt from '@fastify/jwt';

declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: { userId: number; role: 'agent' | 'admin' };
    user: { userId: number; role: 'agent' | 'admin' };
  }
}

if (!process.env['JWT_SECRET']) {
  throw new Error('JWT_SECRET is not set. Check your .env file.');
}

export default fp(async function (fastify: FastifyInstance) {
  fastify.register(jwt, {
    secret: process.env['JWT_SECRET'],
  });
});