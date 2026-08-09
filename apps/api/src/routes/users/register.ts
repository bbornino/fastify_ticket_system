import { FastifyInstance } from "fastify"
import bcrypt from 'bcrypt'
import { db , users } from '@fastify-ticket-system/db'
import { registerSchema } from "./schema-user"

const SALT_ROUNDS = 10

export default async function (fastify: FastifyInstance ) {
    fastify.post('/register', { schema: registerSchema }, async (request, reply) => {
        const { email, password, name } = request.body as {
            email: string;
            password: string;
            name: string;
        }

        const passwordHash = await bcrypt.hash(password, SALT_ROUNDS)

        try {
            const [newUser] = await db
                    .insert(users)
                    .values({
                        email,
                        passwordHash,
                        name,
                    })
                    .returning({
                        id: users.id,
                        email: users.email,
                        name: users.name,
                        role: users.role,
                    })

            return reply.code(201).send(newUser)
        } catch (err) {
            fastify.log.error(err)
            return reply.code(409).send({error: 'Email already in use'})
        }
    })
}