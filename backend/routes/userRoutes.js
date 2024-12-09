// routes/userRoutes.js

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const checkIfBanned = require('../middlewares/banChecker');

// Kullanıcı Kaydı/Güncelleme
router.post('/', userController.createOrUpdateUser);

// Kullanıcının Puanlarını ve 'a' Değerini Almak
router.get('/:user_id/points', userController.getUserPoints);

// Kullanıcının Puanlarını ve 'a' Değerini Güncellemek
router.post('/:user_id/points', userController.updateUserPoints);

// Hile Algılama Eklemek
router.post('/:user_id/cheats', userController.reportCheat);

// Kullanıcının Banlı Olup Olmadığını Kontrol Etmek
router.get('/:user_id/is_banned', userController.isUserBanned);

module.exports = router;
