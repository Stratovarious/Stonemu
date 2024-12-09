// controllers/cheatController.js

const db = require('../models');
const cheatService = require('../services/cheatService');

// Örnek: Hile Raporlama
exports.reportCheat = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { cheat_type } = req.body;

    if (!cheat_type) {
      return res.status(400).json({ error: 'cheat_type gerekli.' });
    }

    const user = await db.User.findByPk(String(user_id));
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const cheat = await db.Cheat.create({
      user_id: String(user_id),
      cheat_type,
    });

    // Kullanıcının hile sayısını güncelle
    user.cheat_count += 1;

    // Hile sayısına göre uyarı veya ban
    if (user.cheat_count >= 3) {
      user.is_banned = true;
    }

    await user.save();

    // Uyarı oluştur
    const warningMessage = user.is_banned
      ? "Hile yaptığınız tespit edildi, hesabınız banlanmıştır."
      : "Hile yaptığınız tespit edildi, lütfen tekrarlamayınız. Tekrarlamanız durumunda hesabınız kapatılacaktır.";

    await db.Warning.create({
      user_id: String(user_id),
      message: warningMessage,
    });

    // WebSocket üzerinden kullanıcıya bildirim gönder
    cheatService.notifyUserOfCheat(String(user_id), warningMessage);

    res.json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
  } catch (error) {
    console.error("POST /api/cheats/report hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
