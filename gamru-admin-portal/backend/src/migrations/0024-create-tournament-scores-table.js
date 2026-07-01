"use strict";

/**
 * Per-player standings for a tournament. Gameplay happens on the games
 * platform, which pushes scores here (clientAuth) so the backoffice can show
 * the same leaderboard players see.
 *
 *   - tournament_id : the gamification `tournaments` row id
 *   - player_id     : resolved gamru player (nullable until mapped)
 *   - email         : player email (stable join key from the games platform)
 *   - player_name   : display name snapshot
 *   - score         : running total of points for this tournament
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("tournament_scores", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      tournament_id: {
        type: Sequelize.UUID,
        allowNull: false,
      },
      player_id: {
        type: Sequelize.UUID,
        allowNull: true,
      },
      email: {
        type: Sequelize.STRING(180),
        allowNull: false,
      },
      player_name: {
        type: Sequelize.STRING(180),
        allowNull: true,
      },
      score: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn("NOW"),
      },
    });

    await queryInterface.addIndex("tournament_scores", ["tournament_id", "email"], {
      unique: true,
      name: "tournament_scores_tournament_email_uq",
    });
    await queryInterface.addIndex("tournament_scores", ["tournament_id"], {
      name: "tournament_scores_tournament_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("tournament_scores");
  },
};
