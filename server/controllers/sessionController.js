import {
  createSession,
  deleteSession,
  getAllSessions,
  getSessionById,
  updateSession,
} from '../services/sessionService.js'

export async function listSessions(req, res) {
  try {
    const sessions = await getAllSessions()
    return res.json({ success: true, data: sessions })
  } catch (error) {
    console.error('List sessions error:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil data sesi.' })
  }
}

export async function showSession(req, res) {
  try {
    const session = await getSessionById(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' })
    }

    return res.json({ success: true, data: session })
  } catch (error) {
    console.error('Show session error:', error)
    return res.status(500).json({ success: false, message: 'Gagal mengambil detail sesi.' })
  }
}

export async function storeSession(req, res) {
  try {
    const session = await createSession(req.body)

    return res.status(201).json({
      success: true,
      message: 'Sesi berhasil dibuat.',
      data: session,
    })
  } catch (error) {
    console.error('Create session error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal membuat sesi.',
    })
  }
}

export async function editSession(req, res) {
  try {
    const session = await updateSession(req.params.id, req.body)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' })
    }

    return res.json({
      success: true,
      message: 'Sesi berhasil diperbarui.',
      data: session,
    })
  } catch (error) {
    console.error('Update session error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal memperbarui sesi.',
    })
  }
}

export async function destroySession(req, res) {
  try {
    const session = await deleteSession(req.params.id)

    if (!session) {
      return res.status(404).json({ success: false, message: 'Sesi tidak ditemukan.' })
    }

    return res.json({
      success: true,
      message: 'Sesi berhasil dihapus.',
      data: session,
    })
  } catch (error) {
    console.error('Delete session error:', error)
    return res.status(500).json({ success: false, message: 'Gagal menghapus sesi.' })
  }
}
