import { pgTable, 
    serial,
    varchar,
    text,
    timestamp,
    pgEnum,
    integer,
} from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', ['agent', 'admin'])

export const ticketStatusEnum = pgEnum('ticket_status', [
    'open', 'in_progress', 'resolved', 'closed'
])

export const ticketPriorityEnum = pgEnum('ticket_priority', [
    'low', 'medium', 'high', 'urgent',
])

export const users = pgTable('users', {
    id: serial('id').primaryKey(),
    email: varchar('email', {length:255}).notNull().unique(),
    passwordHash: varchar('password_hash', {length: 255}).notNull(),
    name: varchar('name', {length: 100}).notNull(),
    role: userRoleEnum('role').notNull().default('agent'),
    createdAt: timestamp('created_at', {withTimezone: true}).notNull().defaultNow(),
})

export const tickets = pgTable('tickets', {
    id: serial('id').primaryKey(),
    subject: varchar('subject', {length: 200}).notNull(),
    description: text('description').notNull(),
    status: ticketStatusEnum('status').notNull().default('open'),
    priority: ticketPriorityEnum('priority').notNull().default('medium'),
    requesterName: varchar('requester_name', { length: 100}).notNull(),
    requesterEmail: varchar('requeter_email', {length: 255}).notNull(),
    assignedAgent: integer('assigned_agent_id').references(() => users.id),
    createdAt: timestamp('created_at', { withTimezone: true}).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true}).notNull().defaultNow(),
})

export const ticketComments = pgTable('ticket_comments', {
    id: serial('id').primaryKey(),
    ticketId: integer('ticket_id').notNull().references(() => tickets.id, { onDelete: 'cascade'}),
    authorId: integer('author_id').notNull().references(() => users.id),
    body: text('body').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true}).notNull().defaultNow(),
})