"use strict";

/**
 * Track where an account originated so the Gamru platform can refuse logins
 * for accounts that were merely mirrored in from an external platform
 * (e.g. a game platform registering via the Gamru service).
 *
 * - "GAMRU"    → created on the Gamru platform itself (can log in to Gamru).
 * - "EXTERNAL" → mirrored in from another platform (cannot log in to Gamru).
 *
 * Existing rows default to "GAMRU" so current users keep their access.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("users", "source", {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "GAMRU",
    });

    await queryInterface.addColumn("players", "source", {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "GAMRU",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("users", "source");
    await queryInterface.removeColumn("players", "source");
  },
};
