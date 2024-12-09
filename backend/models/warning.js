// models/warning.js

module.exports = (sequelize, DataTypes) => {
  const Warning = sequelize.define('Warning', {
    warning_id: {
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
