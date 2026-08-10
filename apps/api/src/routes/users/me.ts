import { FastifyInstance } from "fastify"
import { eq } from 'drizzle-orm'
import { db, users } from '@fastify-ticket-system/db'

export default async function (fastify: FastifyInstance) {
    fastify.get(
        '/me',
        {
            onRequest: [fastify.requireAuth]
        },
        async (request, reply) => {
            const [user] = await db
                    .select({
                        id: users.id,
                        email: users.email,
                        name: users.name,
                        role: users.role,
                    })
                    .from(users)
                    .where(eq(users.id, request.user.userId))
            if (!user) {
                return reply.code(404).send({error: 'User not found'})
            }

            return user
        }
    )
}