// models/users.js

module.exports = (sequelize, DataTypes) => {
    const User = sequelize.define('User', {
        user_id: {
            type: DataTypes.STRING,
            primaryKey: true,
            allowNull: false,
        },
        username: {
            type: DataTypes.STRING,
            allowNull: true,
        },
        points: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        cheat_count: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        is_banned: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
        },
        last_a_update: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        a: {
            type: DataTypes.INTEGER,
            defaultValue: 5000,
        },
        b: {
            type: DataTypes.INTEGER,
            defaultValue: 5000,
        },
        dolum_hizi: {
            type: DataTypes.INTEGER,
            defaultValue: 10,
        },
        tiklama_hakki: {
            type: DataTypes.INTEGER,
            defaultValue: 1,
        },
        created_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
        updated_at: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW,
        },
    }, {
        tableName: 'users',
        timestamps: false, // initialize.sql'de created_at ve updated_at var
    });

    return User;
};
