// models/index.js

const { Sequelize } = require('sequelize'); 
const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: 'postgres',
  protocol: 'postgres',
  logging: console.log, // SQL loglarını etkinleştir
  dialectOptions: {
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
  },
});

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Corrected require paths
db.User = require('./users')(sequelize, Sequelize);
db.Game = require('./game')(sequelize, Sequelize);
db.Cheat = require('./cheat')(sequelize, Sequelize);
db.Warning = require('./warning')(sequelize, Sequelize);

// Associations
db.User.hasMany(db.Game, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Game.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Cheat, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Cheat.belongsTo(db.User, { foreignKey: 'user_id' });

db.User.hasMany(db.Warning, { foreignKey: 'user_id', onDelete: 'CASCADE' });
db.Warning.belongsTo(db.User, { foreignKey: 'user_id' });

module.exports = db;
