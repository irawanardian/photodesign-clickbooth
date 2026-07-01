import express from 'express'
import {
  listPhotosBySession,
  storePhoto,
} from '../controllers/photoController.js'

const router = express.Router()

router.post('/', storePhoto)
router.get('/session/:sessionId', listPhotosBySession)

export default router
