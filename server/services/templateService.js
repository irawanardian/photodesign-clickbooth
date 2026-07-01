import crypto from 'crypto'
import fs from 'fs/promises'
import path from 'path'
import { fileURLToPath } from 'url'
import { pool } from '../config/database.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadRoot = path.resolve(__dirname, '../../public/uploads/templates')

function makeError(message, statusCode = 400) {
  const error = new Error(message)
  error.statusCode = statusCode
  return error
}


function normalizeTemplateDimensions(payload = {}) {
  const dimensionUnit = payload.dimensionUnit || payload.dimension_unit || 'pixels'
  const paperSize = payload.paperSize || payload.paper_size || '4x6'
  const resolutionDpi = Number(payload.resolutionDpi || payload.resolution_dpi || 300)
  const orientation = payload.orientation || 'vertical'
  const canvasWidth = Number(payload.canvasWidth || payload.canvas_width || 1200)
  const canvasHeight = Number(payload.canvasHeight || payload.canvas_height || 1800)

  return {
    dimensionUnit: dimensionUnit === 'pixels' ? 'pixels' : 'pixels',
    paperSize,
    resolutionDpi: Number.isFinite(resolutionDpi) && resolutionDpi > 0 ? resolutionDpi : 300,
    orientation: orientation === 'horizontal' ? 'horizontal' : 'vertical',
    canvasWidth: Number.isFinite(canvasWidth) && canvasWidth > 0 ? Math.round(canvasWidth) : 1200,
    canvasHeight: Number.isFinite(canvasHeight) && canvasHeight > 0 ? Math.round(canvasHeight) : 1800,
  }
}

async function saveTemplateDimensions(template, payload = {}) {
  if (!template?.id) return template

  const dimensions = normalizeTemplateDimensions(payload)

  const result = await pool.query(
    `
      UPDATE photobooth_templates
      SET
        dimension_unit = $2,
        paper_size = $3,
        resolution_dpi = $4,
        orientation = $5,
        canvas_width = $6,
        canvas_height = $7,
        updated_at = NOW()
      WHERE id = $1
      RETURNING ${selectColumns}
    `,
    [
      template.id,
      dimensions.dimensionUnit,
      dimensions.paperSize,
      dimensions.resolutionDpi,
      dimensions.orientation,
      dimensions.canvasWidth,
      dimensions.canvasHeight,
    ],
  )

  return result.rowCount ? mapTemplate(result.rows[0]) : template
}


function mapTemplate(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    isGlobal: row.session_id === null,
    name: row.template_name,
    description: row.description,
    title: row.title,
    subtitle: row.subtitle,
    backgroundColor: row.background_color,
    accentColor: row.accent_color,
    textColor: row.text_color,
    mutedTextColor: row.muted_text_color,
    dimensionUnit: row.dimension_unit || 'pixels',
    paperSize: row.paper_size || '4x6',
    resolutionDpi: Number(row.resolution_dpi || 300),
    orientation: row.orientation || 'vertical',
    canvasWidth: Number(row.canvas_width || 1200),
    canvasHeight: Number(row.canvas_height || 1800),
    overlayImageUrl: row.overlay_image_url,
    overlayFileName: row.overlay_file_name,
    photoSlots: Array.isArray(row.photo_slots) ? row.photo_slots : [],
    imageLayers: Array.isArray(row.image_layers) ? row.image_layers : [],
    isActive: row.is_active,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function normalizeSessionId(value) {
  if (value === undefined || value === null || value === '') return null

  const sessionId = Number(value)

  if (!Number.isInteger(sessionId) || sessionId <= 0) {
    throw makeError('Session ID tidak valid.')
  }

  return sessionId
}

function validateColor(value, fieldName) {
  const color = String(value || '').trim()

  if (!/^#([a-fA-F0-9]{3}|[a-fA-F0-9]{6})$/.test(color)) {
    throw makeError(`${fieldName} harus format hex, contoh #ec4899.`)
  }

  return color
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value)

  if (!Number.isFinite(number)) return fallback

  return Math.max(min, Math.min(max, number))
}

function normalizePhotoSlots(value) {
  if (!Array.isArray(value)) return []

  return value.map((slot, index) => {
    const x = clampNumber(slot.x, 0, 98, 5)
    const y = clampNumber(slot.y, 0, 98, 5)
    const width = clampNumber(slot.width, 2, 100 - x, 30)
    const height = clampNumber(slot.height, 2, 100 - y, 20)

    return {
      id: slot.id || `slot-${index + 1}`,
      x,
      y,
      width,
      height,
      photoIndex: Number.isInteger(Number(slot.photoIndex))
        ? Number(slot.photoIndex)
        : index,
    }
  })
}


function clamp(value, min, max) {
  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) return min

  return Math.max(min, Math.min(max, numericValue))
}

function normalizeImageLayers(layers = []) {
  if (!Array.isArray(layers)) return []

  return layers.map((layer, index) => {
    const id = String(layer.id || `image-layer-${Date.now()}-${index}`)
    const x = clamp(Number(layer.x ?? 10), 0, 98)
    const y = clamp(Number(layer.y ?? 10), 0, 98)
    const width = clamp(Number(layer.width ?? 25), 2, 100 - x)
    const height = clamp(Number(layer.height ?? 15), 2, 100 - y)
    const zIndex = Number.isFinite(Number(layer.zIndex)) ? Number(layer.zIndex) : index + 100

    return {
      id,
      type: 'image',
      name: String(layer.name || `Gambar ${index + 1}`),
      imageUrl: layer.imageUrl || '',
      imageDataUrl: layer.imageDataUrl || '',
      imageFileName: layer.imageFileName || '',
      imageFilePath: layer.imageFilePath || '',
      x: Number(x.toFixed(2)),
      y: Number(y.toFixed(2)),
      width: Number(width.toFixed(2)),
      height: Number(height.toFixed(2)),
      zIndex,
    }
  })
}

async function saveImageLayerFile(dataUrl, templateId, layerId) {
  if (!dataUrl) return null

  const match = String(dataUrl).match(/^data:(image\/png|image\/jpeg|image\/jpg|image\/webp);base64,(.+)$/)

  if (!match) {
    throw makeError('File layer gambar harus berupa PNG, JPG, JPEG, atau WEBP.')
  }

  const mimeType = match[1]
  const base64 = match[2]
  const extensionMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
  }

  const extension = extensionMap[mimeType]
  const buffer = Buffer.from(base64, 'base64')

  const maxSize = 8 * 1024 * 1024
  if (buffer.length > maxSize) {
    throw makeError('Ukuran file layer gambar maksimal 8MB.')
  }

  await fs.mkdir(uploadRoot, { recursive: true })

  const safeLayerId = slugify(layerId) || `layer-${Date.now()}`
  const fileName = `${templateId}-${safeLayerId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  const filePath = path.join(uploadRoot, fileName)

  await fs.writeFile(filePath, buffer)

  return {
    imageUrl: `/uploads/templates/${fileName}`,
    imageFileName: fileName,
    imageFilePath: filePath,
  }
}

async function prepareImageLayers(layers = [], templateId) {
  const normalizedLayers = normalizeImageLayers(layers)
  const preparedLayers = []

  for (const layer of normalizedLayers) {
    const nextLayer = { ...layer }

    if (nextLayer.imageDataUrl) {
      const savedLayer = await saveImageLayerFile(nextLayer.imageDataUrl, templateId, nextLayer.id)

      nextLayer.imageUrl = savedLayer.imageUrl
      nextLayer.imageFileName = savedLayer.imageFileName
      nextLayer.imageFilePath = savedLayer.imageFilePath
      delete nextLayer.imageDataUrl
    }

    preparedLayers.push(nextLayer)
  }

  return preparedLayers
}

function normalizeTemplateInput(payload) {
  const name = String(payload.name || payload.templateName || '').trim()
  const description = String(payload.description || '').trim()
  const title = String(payload.title || 'PHOTOBOOTH').trim()
  const subtitle = String(payload.subtitle || 'Web Photo Session').trim()

  if (!name) throw makeError('Nama template wajib diisi.')
  if (!title) throw makeError('Judul template wajib diisi.')
  if (!subtitle) throw makeError('Subtitle template wajib diisi.')

  return {
    sessionId: normalizeSessionId(payload.sessionId),
    name,
    description,
    title,
    subtitle,
    backgroundColor: validateColor(payload.backgroundColor || '#ffffff', 'Background color'),
    accentColor: validateColor(payload.accentColor || '#ec4899', 'Accent color'),
    textColor: validateColor(payload.textColor || '#111827', 'Text color'),
    mutedTextColor: validateColor(payload.mutedTextColor || '#64748b', 'Muted text color'),
    overlayImageDataUrl: payload.overlayImageDataUrl || '',
    removeOverlayImage: payload.removeOverlayImage === true,
    photoSlots: normalizePhotoSlots(payload.photoSlots),
    imageLayers: normalizeImageLayers(payload.imageLayers),
  }
}

async function ensureSessionExists(sessionId) {
  if (!sessionId) return

  const result = await pool.query(
    'SELECT id FROM photobooth_sessions WHERE id = $1 AND is_active = true LIMIT 1',
    [sessionId],
  )

  if (result.rowCount === 0) {
    throw makeError('Sesi tidak ditemukan.', 404)
  }
}

async function makeUniqueTemplateId(name, sessionId) {
  const baseSlug = slugify(name) || `template-${Date.now()}`
  const prefix = sessionId ? `session-${sessionId}-` : ''
  let templateId = `${prefix}${baseSlug}`

  const existing = await pool.query(
    'SELECT id FROM photobooth_templates WHERE id = $1 LIMIT 1',
    [templateId],
  )

  if (existing.rowCount === 0) return templateId

  templateId = `${prefix}${baseSlug}-${crypto.randomBytes(3).toString('hex')}`
  return templateId
}

async function saveOverlayImage(dataUrl, templateId) {
  if (!dataUrl) return null

  const match = String(dataUrl).match(/^data:(image\/png|image\/jpeg|image\/jpg|image\/webp);base64,(.+)$/)

  if (!match) {
    throw makeError('File template harus berupa PNG, JPG, JPEG, atau WEBP.')
  }

  const mimeType = match[1]
  const base64 = match[2]
  const extensionMap = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/webp': 'webp',
  }

  const extension = extensionMap[mimeType]
  const buffer = Buffer.from(base64, 'base64')

  const maxSize = 8 * 1024 * 1024
  if (buffer.length > maxSize) {
    throw makeError('Ukuran file template maksimal 8MB.')
  }

  await fs.mkdir(uploadRoot, { recursive: true })

  const fileName = `${templateId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}.${extension}`
  const filePath = path.join(uploadRoot, fileName)

  await fs.writeFile(filePath, buffer)

  return {
    overlayImageUrl: `/uploads/templates/${fileName}`,
    overlayFileName: fileName,
    overlayFilePath: filePath,
  }
}

async function deleteOverlayFile(filePath) {
  if (!filePath) return

  try {
    await fs.unlink(filePath)
  } catch (error) {
    if (error.code !== 'ENOENT') {
      console.warn('Gagal hapus file overlay lama:', error.message)
    }
  }
}

const selectColumns = `
  id,
  session_id,
  template_name,
  description,
  title,
  subtitle,
  background_color,
  accent_color,
  text_color,
  muted_text_color,
  dimension_unit,
  paper_size,
  resolution_dpi,
  orientation,
  canvas_width,
  canvas_height,
  overlay_image_url,
  overlay_file_name,
  overlay_file_path,
  photo_slots,
  image_layers,
  is_active,
  created_at,
  updated_at
`

export async function getAllTemplates(sessionId = null) {
  const normalizedSessionId = normalizeSessionId(sessionId)

  if (normalizedSessionId) {
    const result = await pool.query(
      `
        SELECT ${selectColumns}
        FROM photobooth_templates
        WHERE is_active = true
          AND (
            session_id IS NULL
            OR session_id = $1
          )
        ORDER BY
          CASE WHEN session_id IS NULL THEN 0 ELSE 1 END ASC,
          created_at ASC,
          template_name ASC
      `,
      [normalizedSessionId],
    )

    return result.rows.map(mapTemplate)
  }

  const result = await pool.query(`
    SELECT ${selectColumns}
    FROM photobooth_templates
    WHERE is_active = true
      AND session_id IS NULL
    ORDER BY created_at ASC, template_name ASC
  `)

  return result.rows.map(mapTemplate)
}

export async function getSessionTemplatesOnly(sessionId) {
  const normalizedSessionId = normalizeSessionId(sessionId)

  if (!normalizedSessionId) {
    throw makeError('Session ID wajib diisi.')
  }

  const result = await pool.query(
    `
      SELECT ${selectColumns}
      FROM photobooth_templates
      WHERE is_active = true
        AND session_id = $1
      ORDER BY created_at ASC, template_name ASC
    `,
    [normalizedSessionId],
  )

  return result.rows.map(mapTemplate)
}

export async function getTemplateById(id) {
  const result = await pool.query(
    `
      SELECT ${selectColumns}
      FROM photobooth_templates
      WHERE id = $1
        AND is_active = true
      LIMIT 1
    `,
    [id],
  )

  if (result.rowCount === 0) return null
  return mapTemplate(result.rows[0])
}

export async function createTemplate(payload) {
  const data = normalizeTemplateInput(payload)

  await ensureSessionExists(data.sessionId)

  const templateId = await makeUniqueTemplateId(data.name, data.sessionId)
  const overlay = await saveOverlayImage(data.overlayImageDataUrl, templateId)
  const imageLayers = await prepareImageLayers(data.imageLayers, templateId)

  const result = await pool.query(
    `
      INSERT INTO photobooth_templates (
        id,
        session_id,
        template_name,
        description,
        title,
        subtitle,
        background_color,
        accent_color,
        text_color,
        muted_text_color,
        overlay_image_url,
        overlay_file_name,
        overlay_file_path,
        photo_slots,
        image_layers
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb, $15::jsonb)
      RETURNING ${selectColumns}
    `,
    [
      templateId,
      data.sessionId,
      data.name,
      data.description,
      data.title,
      data.subtitle,
      data.backgroundColor,
      data.accentColor,
      data.textColor,
      data.mutedTextColor,
      overlay?.overlayImageUrl || null,
      overlay?.overlayFileName || null,
      overlay?.overlayFilePath || null,
      JSON.stringify(data.photoSlots),
      JSON.stringify(imageLayers),
    ],
  )

  return saveTemplateDimensions(mapTemplate(result.rows[0]), payload)
}

export async function updateTemplate(id, payload) {
  const data = normalizeTemplateInput(payload)

  await ensureSessionExists(data.sessionId)

  const current = await pool.query(
    `
      SELECT id, overlay_file_path
      FROM photobooth_templates
      WHERE id = $1
        AND is_active = true
        AND (
          session_id = $2
          OR ($2::integer IS NULL AND session_id IS NULL)
        )
      LIMIT 1
    `,
    [id, data.sessionId],
  )

  if (current.rowCount === 0) return null

  let overlay = null
  let shouldClearOverlay = data.removeOverlayImage

  if (data.overlayImageDataUrl) {
    overlay = await saveOverlayImage(data.overlayImageDataUrl, id)
    shouldClearOverlay = true
  }

  const imageLayers = await prepareImageLayers(data.imageLayers, id)

  const result = await pool.query(
    `
      UPDATE photobooth_templates
      SET
        template_name = $2,
        description = $3,
        title = $4,
        subtitle = $5,
        background_color = $6,
        accent_color = $7,
        text_color = $8,
        muted_text_color = $9,
        photo_slots = $10::jsonb,
        image_layers = $11::jsonb,
        overlay_image_url = CASE
          WHEN $12::text IS NOT NULL THEN $12
          WHEN $15::boolean = true THEN NULL
          ELSE overlay_image_url
        END,
        overlay_file_name = CASE
          WHEN $13::text IS NOT NULL THEN $13
          WHEN $15::boolean = true THEN NULL
          ELSE overlay_file_name
        END,
        overlay_file_path = CASE
          WHEN $14::text IS NOT NULL THEN $14
          WHEN $15::boolean = true THEN NULL
          ELSE overlay_file_path
        END
      WHERE id = $1
        AND is_active = true
        AND (
          session_id = $16
          OR ($16::integer IS NULL AND session_id IS NULL)
        )
      RETURNING ${selectColumns}
    `,
    [
      id,
      data.name,
      data.description,
      data.title,
      data.subtitle,
      data.backgroundColor,
      data.accentColor,
      data.textColor,
      data.mutedTextColor,
      JSON.stringify(data.photoSlots),
      JSON.stringify(imageLayers),
      overlay?.overlayImageUrl || null,
      overlay?.overlayFileName || null,
      overlay?.overlayFilePath || null,
      shouldClearOverlay,
      data.sessionId,
    ],
  )

  if (result.rowCount === 0) return null

  if (shouldClearOverlay) {
    await deleteOverlayFile(current.rows[0].overlay_file_path)
  }

  return saveTemplateDimensions(mapTemplate(result.rows[0]), payload)
}

export async function duplicateTemplate(id, sessionId) {
  const normalizedSessionId = normalizeSessionId(sessionId)

  if (!normalizedSessionId) {
    throw makeError('Session ID wajib diisi.')
  }

  await ensureSessionExists(normalizedSessionId)

  const current = await pool.query(
    `
      SELECT ${selectColumns}
      FROM photobooth_templates
      WHERE id = $1
        AND session_id = $2
        AND is_active = true
      LIMIT 1
    `,
    [id, normalizedSessionId],
  )

  if (current.rowCount === 0) return null

  const source = current.rows[0]
  const newName = `${source.template_name} Copy`
  const newTemplateId = await makeUniqueTemplateId(newName, normalizedSessionId)

  let overlayImageUrl = source.overlay_image_url
  let overlayFileName = source.overlay_file_name
  let overlayFilePath = source.overlay_file_path

  if (source.overlay_file_path && source.overlay_file_name) {
    try {
      await fs.mkdir(uploadRoot, { recursive: true })

      const extension = path.extname(source.overlay_file_name) || '.png'
      const copiedFileName = `${newTemplateId}-${Date.now()}-${crypto.randomBytes(4).toString('hex')}${extension}`
      const copiedFilePath = path.join(uploadRoot, copiedFileName)

      await fs.copyFile(source.overlay_file_path, copiedFilePath)

      overlayImageUrl = `/uploads/templates/${copiedFileName}`
      overlayFileName = copiedFileName
      overlayFilePath = copiedFilePath
    } catch (error) {
      console.warn('Gagal copy file overlay template:', error.message)
    }
  }

  const result = await pool.query(
    `
      INSERT INTO photobooth_templates (
        id,
        session_id,
        template_name,
        description,
        title,
        subtitle,
        background_color,
        accent_color,
        text_color,
        muted_text_color,
        overlay_image_url,
        overlay_file_name,
        overlay_file_path,
        photo_slots
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14::jsonb)
      RETURNING ${selectColumns}
    `,
    [
      newTemplateId,
      normalizedSessionId,
      newName,
      source.description,
      source.title,
      source.subtitle,
      source.background_color,
      source.accent_color,
      source.text_color,
      source.muted_text_color,
      overlayImageUrl,
      overlayFileName,
      overlayFilePath,
      JSON.stringify(source.photo_slots || []),
    ],
  )

  return mapTemplate(result.rows[0])
}


export async function deleteTemplate(id, sessionId = null) {
  const normalizedSessionId = normalizeSessionId(sessionId)

  const current = await pool.query(
    `
      SELECT ${selectColumns}
      FROM photobooth_templates
      WHERE id = $1
        AND is_active = true
        AND (
          session_id = $2
          OR ($2::integer IS NULL AND session_id IS NULL)
        )
      LIMIT 1
    `,
    [id, normalizedSessionId],
  )

  if (current.rowCount === 0) return null

  const deletedTemplate = mapTemplate(current.rows[0])

  await pool.query(
    `
      DELETE FROM photobooth_templates
      WHERE id = $1
        AND is_active = true
        AND (
          session_id = $2
          OR ($2::integer IS NULL AND session_id IS NULL)
        )
    `,
    [id, normalizedSessionId],
  )

  await deleteOverlayFile(current.rows[0].overlay_file_path)

  return deletedTemplate
}

export async function cleanupSoftDeletedTemplates() {
  const result = await pool.query(
    `
      DELETE FROM photobooth_templates
      WHERE is_active = false
      RETURNING ${selectColumns}
    `,
  )

  for (const row of result.rows) {
    await deleteOverlayFile(row.overlay_file_path)
  }

  return {
    deletedCount: result.rowCount,
    templates: result.rows.map(mapTemplate),
  }
}
