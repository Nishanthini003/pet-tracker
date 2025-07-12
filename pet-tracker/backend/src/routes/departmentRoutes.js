import express from 'express';
import {
  createOfficer,
  getAllOfficers,
  getOfficer,
  updateOfficer,
  deleteOfficer,
  searchOfficers
} from '../controllers/departmentController.js';

const router = express.Router();

router.post('/', createOfficer);
router.get('/', getAllOfficers);
router.get('/search', searchOfficers);
router.get('/:id', getOfficer);
router.patch('/:id', updateOfficer);
router.delete('/:id', deleteOfficer);

export default router;