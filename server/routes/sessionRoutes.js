import express from 'express'
import {
  destroySession,
  editSession,
  listSessions,
  showSession,
  storeSession,
} from '../controllers/sessionController.js'

const router = express.Router()

router.get('/', listSessions)
router.post('/', storeSession)
router.get('/:id', showSession)
router.put('/:id', editSession)
router.delete('/:id', destroySession)

export default router
