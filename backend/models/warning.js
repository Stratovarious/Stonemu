// models/warning.js

module.exports = (sequelize, DataTypes) => {
    const Warning = sequelize.define('Warning', {
        warning_id: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true,
        },
        user_id: {
            type: DataTypes.STRING,
            allowNull: false,
            references: {
                model: 'users',
                key: 'user_id',
            },
        },
        message: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        issued_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'warnings',
        timestamps: false,
    });

    return Warning;
};
