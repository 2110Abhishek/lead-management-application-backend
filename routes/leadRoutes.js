const express = require('express');
const router = express.Router();
const {
  createLead,
  getLeads,
  updateLead,
  deleteLead,
  addNote,
  getLeadById,
} = require('../controllers/leadController');
const { protect, admin } = require('../middleware/authMiddleware');

// Public route for website
router.post('/', createLead);

// Protected routes
router.route('/').get(protect, getLeads);
router
  .route('/:id')
  .get(protect, getLeadById)
  .patch(protect, updateLead)
  .delete(protect, admin, deleteLead);

router.post('/:id/notes', protect, addNote);

module.exports = router;
