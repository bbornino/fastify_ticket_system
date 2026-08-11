import type { FastifyInstance } from "fastify"
import { eq } from "drizzle-orm"
import { db, tickets, ticketComments } from '@fastify-ticket-system/db'
import { createCommentSchema } from './schema-ticket'

export default async function (fastify: FastifyInstance) {
    fastify.post(
        '/:id/comments',
        { onRequest: [fastify.requireAuth], schema: createCommentSchema},
        async (request, reply) => {
            const { id } = request.params as { id: string}
            const {body } = request.body as { body:string}

            const [ticket] = await db
                .select()
                .from(tickets)
                .where(eq(tickets.id, Number(id)))
            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found'})
            }

            const [newComment] = await db
                .insert(ticketComments)
                .values({
                    ticketId: Number(id),
                    authorId: request.user.userId,
                    body,
                })
                .returning()

            return reply.code(201).send(newComment)
        }
    )

    fastify.get(
        '/:id/comments',
        { onRequest: [ fastify.requireAuth]},
        async (request, reply) => {
            const { id } = request.params as { id: string }

            const [ticket] = await db
                .select()
                .from(tickets)
                .where(eq(tickets.id, Number(id)))
            if (!ticket) {
                return reply.code(404).send({ error: 'Ticket not found'})
            }

            const comments = await db
                .select()
                .from(ticketComments)
                .where(eq(ticketComments.ticketId, Number(id)))
                .orderBy(ticketComments.createdAt)

            return comments
        }
    )
}