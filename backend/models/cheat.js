// models/cheat.js

module.exports = (sequelize, DataTypes) => {
    const Cheat = sequelize.define('Cheat', {
        cheat_id: {
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
        cheat_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        detected_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
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
        timestamps: false,
    });

    return Cheat;
};
