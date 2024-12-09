// models/game.js

module.exports = (sequelize, DataTypes) => {
    const Game = sequelize.define('Game', {
        game_id: {
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
        game_type: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        points_earned: {
            type: DataTypes.INTEGER,
            defaultValue: 0,
        },
        claimed: {
            type: DataTypes.BOOLEAN,
            defaultValue: false,
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
        tableName: 'games',
        timestamps: false,
    });

    return Game;
};
