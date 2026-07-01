import {
  cleanupSoftDeletedTemplates,
  createTemplate,
  deleteTemplate,
  duplicateTemplate,
  getAllTemplates,
  getSessionTemplatesOnly,
  getTemplateById,
  updateTemplate,
} from '../services/templateService.js'

export async function listTemplates(req, res) {
  try {
    const templates = await getAllTemplates(req.query.sessionId)

    return res.json({ success: true, data: templates })
  } catch (error) {
    console.error('List templates error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal mengambil data template.',
    })
  }
}

export async function listSessionTemplates(req, res) {
  try {
    const templates = await getSessionTemplatesOnly(req.params.sessionId)

    return res.json({ success: true, data: templates })
  } catch (error) {
    console.error('List session templates error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal mengambil template sesi.',
    })
  }
}

export async function showTemplate(req, res) {
  try {
    const template = await getTemplateById(req.params.id)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan.',
      })
    }

    return res.json({ success: true, data: template })
  } catch (error) {
    console.error('Show template error:', error)

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil detail template.',
    })
  }
}

export async function storeTemplate(req, res) {
  try {
    const template = await createTemplate(req.body)

    return res.status(201).json({
      success: true,
      message: 'Template berhasil dibuat.',
      data: template,
    })
  } catch (error) {
    console.error('Create template error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal membuat template.',
    })
  }
}

export async function editTemplate(req, res) {
  try {
    const template = await updateTemplate(req.params.id, req.body)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan untuk sesi ini.',
      })
    }

    return res.json({
      success: true,
      message: 'Template berhasil diperbarui.',
      data: template,
    })
  } catch (error) {
    console.error('Update template error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal memperbarui template.',
    })
  }
}

export async function duplicateTemplateAction(req, res) {
  try {
    const template = await duplicateTemplate(req.params.id, req.body.sessionId || req.query.sessionId)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan untuk sesi ini.',
      })
    }

    return res.status(201).json({
      success: true,
      message: 'Template berhasil diduplikat.',
      data: template,
    })
  } catch (error) {
    console.error('Duplicate template error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal menduplikat template.',
    })
  }
}


export async function cleanupSoftDeletedTemplatesAction(req, res) {
  try {
    const result = await cleanupSoftDeletedTemplates()

    return res.json({
      success: true,
      message: `Berhasil menghapus permanen ${result.deletedCount} template soft-delete.`,
      data: result,
    })
  } catch (error) {
    console.error('Cleanup soft-deleted templates error:', error)

    return res.status(500).json({
      success: false,
      message: 'Gagal membersihkan template soft-delete.',
    })
  }
}


export async function destroyTemplate(req, res) {
  try {
    const template = await deleteTemplate(req.params.id, req.query.sessionId)

    if (!template) {
      return res.status(404).json({
        success: false,
        message: 'Template tidak ditemukan untuk sesi ini.',
      })
    }

    return res.json({
      success: true,
      message: 'Template berhasil dihapus permanen.',
      data: template,
    })
  } catch (error) {
    console.error('Delete template error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal menonaktifkan template.',
    })
  }
}
