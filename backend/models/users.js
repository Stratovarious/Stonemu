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
    a: { // Tıklama hakkı
      type: DataTypes.INTEGER,
      defaultValue: 5000,
    },
    b: { // Maksimum tıklama hakkı
      type: DataTypes.INTEGER,
      defaultValue: 5000,
    },
    dolum_hizi: { // Dolum hızı (saniye cinsinden)
      type: DataTypes.INTEGER,
      defaultValue: 10,
    },
    tiklama_hakki: { // Her tıklamada eklenen puan
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
  }, {
    tableName: 'users',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
  });

  return User;
};
