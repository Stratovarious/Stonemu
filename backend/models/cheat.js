module.exports = (sequelize, DataTypes) => {
  const Cheat = sequelize.define('Cheat', {
    cheat_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
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
