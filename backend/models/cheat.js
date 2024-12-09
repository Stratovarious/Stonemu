// models/cheat.js

module.exports = (sequelize, DataTypes) => {
  const Cheat = sequelize.define('Cheat', {
    cheat_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    user_id: { // Added to align with SQL schema
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: 'users',
        key: 'user_id',
      },
      onDelete: 'CASCADE',
    },
    cheat_type: {
      type: DataTypes.STRING,
    },
    warning_count: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    is_banned: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
  }, {
    tableName: 'cheats',
    timestamps: true,
    createdAt: 'detected_at',
    updatedAt: false,
  });

  return Cheat;
};
