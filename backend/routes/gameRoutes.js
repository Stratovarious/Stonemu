// routes/gameRoutes.js

const express = require('express');
const router = express.Router();
const gameController = require('../controllers/gameController');
const checkIfBanned = require('../middlewares/banChecker');

// Örnek: Oyun Başlatma
router.post('/start', gameController.startGame);

// Örnek: Oyun Sonlandırma
router.post('/end', gameController.endGame);

module.exports = router;
