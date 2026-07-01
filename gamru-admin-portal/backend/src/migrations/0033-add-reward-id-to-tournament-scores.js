"use strict";

/**
 * Link a tournament standing to the reward it grants. On settlement GAMRU now
 * creates an IN_PROGRESS `player_reward` for each winner (so the prize shows in
 * the player's rewards, claimable), and stores its id here. The player can then
 * claim from EITHER the tournament page or the rewards table — both resolve to
 * the same single reward, so the prize is granted (and the wallet credited)
 * exactly once.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("tournament_scores", "reward_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("tournament_scores", "reward_id");
  },
};
