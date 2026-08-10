import { FastifyInstance } from "fastify"
import bcrypt from 'bcrypt'
import { eq } from "drizzle-orm"
import { db, users } from '@fastify-ticket-system/db'
import { loginSchema } from "./schema-user"

export default async function ( fastify: FastifyInstance) {
    fastify.post('/login', { schema: loginSchema }, async (request, reply) => {
        const { email, password} = request.body as {
            email: string
            password: string
        }

        const [user] = await db
                .select()
                .from(users)
                .where(eq(users.email, email))
        if (!user) {
            return reply.code(401).send({ error: 'Invalid email or password' })
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash)
        if (!passwordMatches) {
            return reply.code(401).send({ error: 'Invalid email or password' })
        }

        const token = fastify.jwt.sign(
            {userId: user.id, role: user.role },
            { expiresIn: '1h'}
        )

        return reply.send({ token })
    })
}