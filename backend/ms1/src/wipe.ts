import { pool } from './database/client.js'

async function wipe() {
  await pool.query('TRUNCATE TABLE users CASCADE;')
  console.log('Wiped users table and related data.')
  process.exit(0)
}

wipe()
