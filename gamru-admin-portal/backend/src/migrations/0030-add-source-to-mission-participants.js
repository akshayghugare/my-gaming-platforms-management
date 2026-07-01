"use strict";

/**
 * Denormalize the player's `source` (GAMRU / EXTERNAL / GAMIFY / …) onto each
 * participation row so the operator console can show it and filter the
 * "Participated players" modal by it without a per-row join. Set on record
 * (from the resolved player) and backfilled here for existing rows.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("mission_participants", "source", {
      type: Sequelize.STRING(40),
      allowNull: true,
    });

    await queryInterface.sequelize.query(
      `UPDATE mission_participants mp
         SET source = p.source
        FROM players p
       WHERE mp.player_id = p.id
         AND mp.source IS NULL`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("mission_participants", "source");
  },
};
