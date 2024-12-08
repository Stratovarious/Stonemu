module.exports = (sequelize, DataTypes) => {
  const Warning = sequelize.define('Warning', {
    warning_id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    message: {
      type: DataTypes.TEXT,
    },
  }, {
    tableName: 'warnings',
    timestamps: true,
    createdAt: 'issued_at',
    updatedAt: false,
  });

  return Warning;
};
