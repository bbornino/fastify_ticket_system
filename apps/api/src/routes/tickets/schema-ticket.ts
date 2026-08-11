export const createTicketSchema = {
    body: {
        type: 'object',
        required: ['subject', 'description', 'requesterName', 'requesterEmail'],
        properties: {
            subject: { type: 'string', minLength: 1, maxLength: 200 },
            description: {type: 'string', minLength: 1 },
            priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
            },
            requesterName: { type: 'string', minLength: 1, maxLength: 100 },
            requesterEmail: { type: 'string', format: 'email'},
        },
        additionalProperties: false,
    },
} as const

export const updateTicketSchema = {
    body: {
        type: 'object',
        properties: {
            status: {
                type: 'string',
                enum: ['open', 'in_progress', 'resolved', 'closed'],
            },
            priority: {
                type: 'string',
                enum: ['low', 'medium', 'high', 'urgent'],
            },
            assignedAgentId: { type: ['integer', 'null']},
        },
        additionalProperties: false,
        minProperties: 1,
    },
} as const

export const createCommentSchema = {
    body: {
        type: 'object',
        required: ['body'],
        properties: {
            body: { type: 'string', minLength: 1 },
        },
        additionalProperties: false,
    },
} as const