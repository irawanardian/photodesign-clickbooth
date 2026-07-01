import express from 'express'
import {
  cleanupSoftDeletedTemplatesAction,
  destroyTemplate,
  duplicateTemplateAction,
  editTemplate,
  listSessionTemplates,
  listTemplates,
  showTemplate,
  storeTemplate,
} from '../controllers/templateController.js'

const router = express.Router()

router.get('/', listTemplates)
router.get('/session/:sessionId', listSessionTemplates)
router.delete('/cleanup/soft-deleted', cleanupSoftDeletedTemplatesAction)
router.post('/', storeTemplate)
router.post('/:id/duplicate', duplicateTemplateAction)
router.get('/:id', showTemplate)
router.put('/:id', editTemplate)
router.delete('/:id', destroyTemplate)

export default router
