"use strict";

/**
 * Promote `tournament_scores` from a leaderboard-mirror to the per-player
 * tournament PARTICIPATION + PROGRESS table of record.
 *
 * GAMRU is now the single source of truth for tournament progress: it owns
 * registration, scoring, ranking, end-of-tournament settlement and reward
 * claiming. On settlement it ranks players by score, computes the prize split
 * and grants a `player_reward` (source "tournaments") per winner — the player
 * claims it the same way as a mission reward. The games platform forwards
 * scores and caches the response.
 *
 * New columns:
 *   - plays         : total plays counted toward this tournament
 *   - games_played  : { [gameKey]: count } breakdown
 *   - registered    : the player explicitly joined / opted in
 *   - opted_in      : opt-in flag (paid / buy-in tournaments)
 *   - rank          : last computed leaderboard rank (1-based), null until ranked
 *   - prize_amount  : the player's settled prize share
 *   - prize_awarded : settlement guard — a winner's reward was granted once
 *   - claimed_at    : when the player claimed the prize reward
 *   - status        : REGISTERED | RANKED | WON | CLAIMED (latest known)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tournament_scores", "plays", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("tournament_scores", "games_played", {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: {},
    });
    await queryInterface.addColumn("tournament_scores", "registered", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("tournament_scores", "opted_in", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("tournament_scores", "rank", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn("tournament_scores", "prize_amount", {
      type: Sequelize.FLOAT,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("tournament_scores", "prize_awarded", {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });
    await queryInterface.addColumn("tournament_scores", "claimed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("tournament_scores", "status", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tournament_scores", "status");
    await queryInterface.removeColumn("tournament_scores", "claimed_at");
    await queryInterface.removeColumn("tournament_scores", "prize_awarded");
    await queryInterface.removeColumn("tournament_scores", "prize_amount");
    await queryInterface.removeColumn("tournament_scores", "rank");
    await queryInterface.removeColumn("tournament_scores", "opted_in");
    await queryInterface.removeColumn("tournament_scores", "registered");
    await queryInterface.removeColumn("tournament_scores", "games_played");
    await queryInterface.removeColumn("tournament_scores", "plays");
  },
};
