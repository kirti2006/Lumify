import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import * as schema from './schema.js'

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
})

pool.on('error', (error) => {
  logger.error('postgres_pool_error', { message: error.message })
})

export const db = drizzle(pool, { schema })

export async function checkDatabase(): Promise<boolean> {
  try {
    const client = await pool.connect()

    await client.query("SELECT 1")

    client.release()

    console.log("✅ Database Connected Successfully")

    return true
  } catch (err) {
    console.error("❌ DATABASE ERROR")
    console.error(err)
    throw err
  }
}
