import { db } from '../lib/db'
import { sql } from 'drizzle-orm'

async function ping() {
    try {
        await db.execute(sql`SELECT 1`)
        console.log('✅ Database connection OK')
        process.exit(0)
    } catch (err) {
        console.error('❌ Database connection failed:', err)
        process.exit(1)
    }
}

ping()