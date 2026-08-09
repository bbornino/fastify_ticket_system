export const registerSchema = {
    body: {
        type: 'object',
        required: ['email', 'password', 'name'],
        properties: {
            email: {type: 'string', format: 'email'},
            password: {type: 'string', minLength: 8 },
            name: {type: 'string', minLength: 1, maxLength: 100 },
        },
        additionalProperties: false,
    },
} as const

export const loginSchema = {
    body: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
            email: {type: 'string', format: 'email' },
            password: { type: 'string'},
        },
        additionalProperties: false
    },
} as const