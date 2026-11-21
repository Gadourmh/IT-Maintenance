// routes/chatbotRoutes.js
const express = require('express');
const router = express.Router();
const chatbotController = require('../controllers/chatbotController');
const { protect } = require('../middleware/authMiddleware');

// ✅ MODIFICATION ICI : Appeler processCommand
router.post('/message', protect, chatbotController.processCommand);
router.get('/history', protect, chatbotController.getChatHistory);

module.exports = router;