// routes/cheatRoutes.js

const express = require('express');
const router = express.Router();
const cheatController = require('../controllers/cheatController');
const checkIfBanned = require('../middlewares/banChecker');

// Örnek: Hile Raporlama
router.post('/:user_id/report', cheatController.reportCheat);

module.exports = router;
