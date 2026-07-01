import {
  getPhotosBySession,
  savePhoto,
} from '../services/photoService.js'

export async function storePhoto(req, res) {
  try {
    const photo = await savePhoto(req.body)

    return res.status(201).json({
      success: true,
      message: 'Foto berhasil disimpan.',
      data: photo,
    })
  } catch (error) {
    console.error('Save photo error:', error)

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.statusCode ? error.message : 'Gagal menyimpan foto.',
    })
  }
}

export async function listPhotosBySession(req, res) {
  try {
    const photos = await getPhotosBySession(req.params.sessionId)

    return res.json({
      success: true,
      data: photos,
    })
  } catch (error) {
    console.error('List photos error:', error)

    return res.status(500).json({
      success: false,
      message: 'Gagal mengambil data foto.',
    })
  }
}
