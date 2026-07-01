import fs from 'fs/promises'
import path from 'path'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const projectRoot = path.resolve(__dirname, '../..')
const uploadDir = path.join(projectRoot, 'public', 'uploads', 'photobooth')

function makeError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapPhoto(row) {
  return {
    id: Number(row.id),
    sessionId: Number(row.session_id),
    fileName: row.file_name,
    filePath: row.file_path,
    imageUrl: row.image_url,
    frameId: row.frame_id,
    layoutId: row.layout_id,
    createdAt: row.created_at,
  }
}

async function checkSession(sessionId) {
  const result = await pool.query(
    `
      SELECT id
      FROM photobooth_sessions
      WHERE id = $1
        AND is_active = true
      LIMIT 1
    `,
    [sessionId],
  )

  return result.rowCount > 0
}

function dataUrlToBuffer(imageDataUrl) {
  if (!imageDataUrl || typeof imageDataUrl !== 'string') {
    throw makeError('Data gambar wajib dikirim.')
  }

  const match = imageDataUrl.match(/^data:image\/png;base64,(.+)$/)

  if (!match) {
    throw makeError('Format gambar harus PNG base64.')
  }

  return Buffer.from(match[1], 'base64')
}

export async function savePhoto(payload) {
  const sessionId = Number(payload.sessionId)
  const frameId = String(payload.frameId || '').trim()
  const layoutId = String(payload.layoutId || '').trim()

  if (!sessionId) throw makeError('Session ID wajib diisi.')
  if (!frameId) throw makeError('Template wajib diisi.')
  if (!layoutId) throw makeError('Layout wajib diisi.')

  const sessionExists = await checkSession(sessionId)

  if (!sessionExists) {
    throw makeError('Sesi tidak ditemukan.', 404)
  }

  const imageBuffer = dataUrlToBuffer(payload.imageDataUrl)

  await fs.mkdir(uploadDir, { recursive: true })

  const randomName = crypto.randomBytes(8).toString('hex')
  const fileName = `session-${sessionId}-${Date.now()}-${randomName}.png`
  const filePath = path.join(uploadDir, fileName)
  const imageUrl = `/uploads/photobooth/${fileName}`

  await fs.writeFile(filePath, imageBuffer)

  const result = await pool.query(
    `
      INSERT INTO photobooth_photos (
        session_id,
        file_name,
        file_path,
        image_url,
        frame_id,
        layout_id
      )
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING
        id,
        session_id,
        file_name,
        file_path,
        image_url,
        frame_id,
        layout_id,
        created_at
    `,
    [sessionId, fileName, filePath, imageUrl, frameId, layoutId],
  )

  return mapPhoto(result.rows[0])
}

export async function getPhotosBySession(sessionId) {
  const result = await pool.query(
    `
      SELECT
        id,
        session_id,
        file_name,
        file_path,
        image_url,
        frame_id,
        layout_id,
        created_at
      FROM photobooth_photos
      WHERE session_id = $1
      ORDER BY created_at DESC, id DESC
    `,
    [sessionId],
  )

  return result.rows.map(mapPhoto)
}
