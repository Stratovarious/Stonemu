// controllers/gameController.js

const db = require('../models');
const gameService = require('../services/gameService');

// Örnek: Oyun Başlatma
exports.startGame = async (req, res) => {
  try {
    const { user_id, game_type } = req.body;

    if (!user_id || !game_type) {
      return res.status(400).json({ error: 'user_id ve game_type gerekli.' });
    }

    const user = await db.User.findByPk(String(user_id));
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const game = await db.Game.create({
      user_id: String(user_id),
      game_type,
      points_earned: 0,
      claimed: false,
    });

    res.json(game);
  } catch (error) {
    console.error("POST /api/games/start hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// Örnek: Oyun Sonlandırma
exports.endGame = async (req, res) => {
  try {
    const { game_id, user_id, points_earned } = req.body;

    if (!game_id || !user_id || typeof points_earned !== 'number') {
      return res.status(400).json({ error: 'game_id, user_id ve points_earned gerekli.' });
    }

    const game = await db.Game.findOne({
      where: { game_id: game_id, user_id: String(user_id) },
    });

    if (!game) {
      return res.status(404).json({ error: 'Oyun bulunamadı.' });
    }

    game.points_earned += points_earned;
    await game.save();

    res.json(game);
  } catch (error) {
    console.error("POST /api/games/end hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
