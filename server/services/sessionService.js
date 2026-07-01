import { pool } from '../config/database.js'

const allowedFrameIds = ['pink-classic', 'dark-elegant', 'clean-white']
const allowedLayoutIds = ['vertical-strip', 'grid-2x2']
const allowedTotalPhotos = [3, 4]
const allowedCountdownSeconds = [3, 5, 10]
const allowedPrintSizes = ['2r', '4r']

function makeError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}

function mapSession(row) {
  return {
    id: Number(row.id),
    sessionName: row.session_name,
    eventTitle: row.event_title,
    eventSubtitle: row.event_subtitle,
    frameId: row.frame_id,
    layoutId: row.layout_id,
    printSize: row.print_size || '4r',
    totalPhotos: Number(row.total_photos),
    countdownSeconds: Number(row.countdown_seconds),
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function normalizeSessionInput(payload) {
  const sessionName = String(payload.sessionName || '').trim()
  const eventTitle = String(payload.eventTitle || 'PHOTOBOOTH').trim()
  const eventSubtitle = String(payload.eventSubtitle || 'Web Photo Session').trim()
  const frameId = String(payload.frameId || 'pink-classic').trim()
  const layoutId = String(payload.layoutId || 'vertical-strip').trim()
  const printSize = String(payload.printSize || '4r').trim().toLowerCase()
  const totalPhotos = Number(payload.totalPhotos || 4)
  const countdownSeconds = Number(payload.countdownSeconds || 3)

  if (!sessionName) throw makeError('Nama sesi wajib diisi.')
  if (!eventTitle) throw makeError('Judul event wajib diisi.')
  if (!eventSubtitle) throw makeError('Subtitle event wajib diisi.')
  if (!allowedFrameIds.includes(frameId)) throw makeError('Template tidak valid.')
  if (!allowedLayoutIds.includes(layoutId)) throw makeError('Layout tidak valid.')
  if (!allowedPrintSizes.includes(printSize)) throw makeError('Ukuran cetak harus 2R atau 4R.')
  if (!allowedTotalPhotos.includes(totalPhotos)) throw makeError('Jumlah foto harus 3 atau 4.')
  if (!allowedCountdownSeconds.includes(countdownSeconds)) throw makeError('Countdown harus 3, 5, atau 10 detik.')

  return {
    sessionName,
    eventTitle,
    eventSubtitle,
    frameId,
    layoutId,
    printSize,
    totalPhotos,
    countdownSeconds,
  }
}

const selectFields = `
  id,
  session_name,
  event_title,
  event_subtitle,
  frame_id,
  layout_id,
  print_size,
  total_photos,
  countdown_seconds,
  is_active,
  created_at,
  updated_at
`

export async function getAllSessions() {
  const result = await pool.query(`
    SELECT ${selectFields}
    FROM photobooth_sessions
    WHERE is_active = true
    ORDER BY created_at DESC, id DESC
  `)

  return result.rows.map(mapSession)
}

export async function getSessionById(id) {
  const result = await pool.query(
    `
      SELECT ${selectFields}
      FROM photobooth_sessions
      WHERE id = $1
        AND is_active = true
      LIMIT 1
    `,
    [id],
  )

  if (result.rowCount === 0) return null

  return mapSession(result.rows[0])
}

export async function createSession(payload) {
  const data = normalizeSessionInput(payload)

  const result = await pool.query(
    `
      INSERT INTO photobooth_sessions (
        session_name,
        event_title,
        event_subtitle,
        frame_id,
        layout_id,
        print_size,
        total_photos,
        countdown_seconds
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING ${selectFields}
    `,
    [
      data.sessionName,
      data.eventTitle,
      data.eventSubtitle,
      data.frameId,
      data.layoutId,
      data.printSize,
      data.totalPhotos,
      data.countdownSeconds,
    ],
  )

  return mapSession(result.rows[0])
}

export async function updateSession(id, payload) {
  const data = normalizeSessionInput(payload)

  const result = await pool.query(
    `
      UPDATE photobooth_sessions
      SET
        session_name = $2,
        event_title = $3,
        event_subtitle = $4,
        frame_id = $5,
        layout_id = $6,
        print_size = $7,
        total_photos = $8,
        countdown_seconds = $9
      WHERE id = $1
        AND is_active = true
      RETURNING ${selectFields}
    `,
    [
      id,
      data.sessionName,
      data.eventTitle,
      data.eventSubtitle,
      data.frameId,
      data.layoutId,
      data.printSize,
      data.totalPhotos,
      data.countdownSeconds,
    ],
  )

  if (result.rowCount === 0) return null

  return mapSession(result.rows[0])
}

export async function deleteSession(id) {
  const result = await pool.query(
    `
      UPDATE photobooth_sessions
      SET is_active = false
      WHERE id = $1
        AND is_active = true
      RETURNING ${selectFields}
    `,
    [id],
  )

  if (result.rowCount === 0) return null

  return mapSession(result.rows[0])
}
