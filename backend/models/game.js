// models/game.js

module.exports = (sequelize, DataTypes) => { 
  const Game = sequelize.define('Game', {
    game_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    game_type: {
      type: DataTypes.STRING,
    },
    points_earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    claimed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'games',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return Game;
};
