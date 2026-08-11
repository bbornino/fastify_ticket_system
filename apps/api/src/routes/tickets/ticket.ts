import type { FastifyInstance } from 'fastify'
import { eq } from 'drizzle-orm'
import { db, tickets } from '@fastify-ticket-system/db'
import { updateTicketSchema } from './schema-ticket'

export default async function (fastify: FastifyInstance) {
    fastify.get(
        '/:id',
        { onRequest: [fastify.requireAuth] },
        async (request, reply) => {
            const { id } = request.params as { id: string }

            const [ticket] = await db
                .select()
                .from(tickets)
                .where(eq(tickets.id, Number(id)))
            if (!ticket) {
                return reply.code(404).send({error: 'Ticket not found'})
            }

            return ticket
        }
    )

    fastify.patch(
        '/:id',
        { onRequest: [fastify.requireAuth], schema: updateTicketSchema },
        async ( request, reply) => {
            const { id } = request.params as { id: string }
            const updates = request.body as Partial<{
                status: 'open' | 'in_progress' | 'resolved' | 'closed'
                priority: 'low' | 'medium' | 'high' | 'urgent'
                assignedAgentId: number | null
            }>

            const [updatedTicket] = await db
                .update(tickets)
                .set({ ...updates, updatedAt: new Date()})
                .where(eq(tickets.id, Number(id)))
                .returning()

            if (!updatedTicket) {
                return reply.code(404).send({ error: 'Ticket not found'})
            }

            return updatedTicket
        }
    )
}