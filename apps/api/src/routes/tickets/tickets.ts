import type { FastifyInstance } from 'fastify';
import { db, tickets } from '@fastify-ticket-system/db';
import { eq, and, desc } from 'drizzle-orm';
import { createTicketSchema } from './schema-ticket';

export default async function (fastify: FastifyInstance) {
  fastify.get(
    '/',
    { onRequest: [fastify.requireAuth] },
    async (request) => {
      const query = request.query as { status?: string; priority?: string };

      const conditions = [];
      if (query.status) {
        conditions.push(eq(tickets.status, query.status as any));
      }
      if (query.priority) {
        conditions.push(eq(tickets.priority, query.priority as any));
      }

      const allTickets = await db
        .select()
        .from(tickets)
        .where(conditions.length ? and(...conditions) : undefined)
        .orderBy(desc(tickets.createdAt));

      return allTickets;
    }
  );

  fastify.post(
    '/',
    { onRequest: [fastify.requireAuth], schema: createTicketSchema },
    async (request, reply) => {
      const { subject, description, priority, requesterName, requesterEmail } =
        request.body as {
          subject: string;
          description: string;
          priority?: 'low' | 'medium' | 'high' | 'urgent';
          requesterName: string;
          requesterEmail: string;
        };

      const [newTicket] = await db
        .insert(tickets)
        .values({
          subject,
          description,
          priority,
          requesterName,
          requesterEmail,
        })
        .returning();

      return reply.code(201).send(newTicket);
    }
  );
}