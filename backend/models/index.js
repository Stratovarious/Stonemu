const { Sequelize } = require('sequelize');
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

db.User = require('./user')(sequelize, Sequelize);
db.Game = require('./game')(sequelize, Sequelize);
db.Cheat = require('./cheat')(sequelize, Sequelize);
db.Warning = require('./warning')(sequelize, Sequelize);

// İlişkiler
db.User.hasMany(db.Game, { foreignKey: 'user_id' });
db.Game.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Cheat, { foreignKey: 'user_id' });
db.Cheat.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Warning, { foreignKey: 'user_id' });
db.Warning.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
