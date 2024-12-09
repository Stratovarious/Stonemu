// middlewares/banChecker.js

const db = require('../models');

const checkIfBanned = async (req, res, next) => {
  try {
    const { user_id } = req.params;
    const userIdStr = String(user_id); // user_id'yi string'e dönüştür

    const user = await db.User.findByPk(userIdStr);
    if (user && user.is_banned) {
      return res.status(403).json({ error: 'Hesabınız banlanmıştır.' });
    }
    next();
  } catch (error) {
    console.error("Ban kontrolü sırasında hata:", error);
    res.status(500).json({ error: 'Sunucu hatası.' });
  }
};

module.exports = checkIfBanned;
