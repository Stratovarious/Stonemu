// controllers/userController.js

const db = require('../models');
const userService = require('../services/userService');

// 1. Kullanıcı Kaydı/Güncelleme
exports.createOrUpdateUser = async (req, res) => {
  try {
    const { user_id, username } = req.body;
    console.log("Received POST /api/users with data:", req.body);

    if (typeof user_id !== 'string' || user_id.trim() === '') {
      console.error("Geçersiz veya eksik user_id.");
      return res.status(400).json({ error: 'Geçersiz veya eksik user_id.' });
    }

    const userIdStr = String(user_id);

    const [user, created] = await db.User.findOrCreate({
      where: { user_id: userIdStr },
      defaults: { username },
    });

    if (created) {
      console.log(`Yeni kullanıcı oluşturuldu: ${userIdStr} - ${username}`);
    } else {
      console.log(`Kullanıcı güncellendi: ${userIdStr} - ${username}`);
      user.username = username || user.username;
      await user.save();
      console.log(`Kullanıcı kaydedildi: ${userIdStr} - ${user.username}`);
    }

    res.json(user);
  } catch (error) {
    console.error("POST /api/users hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// 2. Kullanıcının Puanlarını ve 'a' Değerini Almak
exports.getUserPoints = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    // Geçen süreyi hesapla
    const now = Date.now();
    const lastUpdate = new Date(user.last_a_update).getTime();
    const elapsedSeconds = Math.floor((now - lastUpdate) / 1000);
    const dolumHizi = user.dolum_hizi || 10;
    const aIncrement = Math.floor(elapsedSeconds / dolumHizi);
    if (aIncrement > 0) {
      user.a += aIncrement;
      if (user.a > user.b) user.a = user.b;
      user.last_a_update = new Date(lastUpdate + aIncrement * dolumHizi * 1000);
      await user.save();
    }

    res.json({ 
      points: user.points, 
      a: user.a, 
      b: user.b, 
      dolum_hizi: user.dolum_hizi, 
      tiklama_hakki: user.tiklama_hakki 
    });
  } catch (error) {
    console.error("GET /api/users/:user_id/points hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// 3. Kullanıcının Puanlarını ve 'a' Değerini Güncellemek
exports.updateUserPoints = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { points, a } = req.body;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    if (typeof points === 'number') {
      user.points += points;
    }

    if (typeof a === 'number') {
      user.a = a;
    }

    await user.save();

    res.json({ points: user.points, a: user.a });
  } catch (error) {
    console.error("POST /api/users/:user_id/points hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// 4. Hile Algılama Eklemek
exports.reportCheat = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { cheat_type } = req.body;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    if (!cheat_type) {
      return res.status(400).json({ error: 'cheat_type gerekli.' });
    }

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const cheat = await db.Cheat.create({
      user_id: userIdStr,
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
      user_id: userIdStr,
      message: warningMessage,
    });

    // WebSocket üzerinden kullanıcıya bildirim gönder
    userService.notifyUserOfCheat(userIdStr, warningMessage);

    res.json({ message: 'Hile tespit edildi.', is_banned: user.is_banned });
  } catch (error) {
    console.error("POST /api/users/:user_id/cheats hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

// 5. Kullanıcının Banlı Olup Olmadığını Kontrol Etmek
exports.isUserBanned = async (req, res) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (!user) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }
    res.json({ is_banned: user.is_banned });
  } catch (error) {
    console.error("GET /api/users/:user_id/is_banned hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};
