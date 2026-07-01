import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import dotenv from 'dotenv'
import sessionRoutes from './routes/sessionRoutes.js'
import templateRoutes from './routes/templateRoutes.js'
import photoRoutes from './routes/photoRoutes.js'
import { testDatabaseConnection } from './config/database.js'

dotenv.config()

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '..')

const app = express()
const port = Number(process.env.APP_PORT || 5005)

app.use(cors())
app.use(express.json({ limit: '25mb' }))
app.use('/uploads', express.static(path.join(projectRoot, 'public', 'uploads')))

app.get('/api/health', async (req, res) => {
  try {
    const database = await testDatabaseConnection()

    return res.json({
      success: true,
      message: 'Photobooth API running.',
      database,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Database tidak terkoneksi.',
    })
  }
})

app.use('/api/templates', templateRoutes)
app.use('/api/sessions', sessionRoutes)
app.use('/api/photos', photoRoutes)

app.use((req, res) => {
  return res.status(404).json({
    success: false,
    message: 'Route tidak ditemukan.',
  })
})

app.listen(port, '0.0.0.0', () => {
  console.log(`Photobooth API running on http://0.0.0.0:${port}`)
})
