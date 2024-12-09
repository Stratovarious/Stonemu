// middlewares/rateLimiter.js

const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dakika
  max: 100, // Her IP için maksimum 100 istek
  message: 'Çok fazla istek gönderildi, lütfen daha sonra tekrar deneyin.',
});

module.exports = apiLimiter;
