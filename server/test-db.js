import { testDatabaseConnection, pool } from './config/database.js'

try {
  const result = await testDatabaseConnection()

  console.log('Database connected successfully')
  console.log(result)
} catch (error) {
  console.error('Database connection failed')
  console.error(error.message)
  process.exitCode = 1
} finally {
  await pool.end()
}
