// models/users.js

module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define('User', {
    user_id: {
      type: DataTypes.STRING,
      primaryKey: true,
    },
    username: {
      type: DataTypes.STRING,
    },
    points: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    a: { // Click rights
      type: DataTypes.INTEGER,
      defaultValue: 5000,
    },
    b: { // Maximum click rights
      type: DataTypes.INTEGER,
      defaultValue: 5000,
    },
    dolum_hizi: { // Refill speed (in seconds)
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    tiklama_hakki: { // Points added per click
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    cheat_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    last_a_update: { // Added as per SQL schema
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return User;
};
