"use strict";

/**
 * Per-widget UI customization (edited in gamru Settings → Widget / iFrame Setup).
 * Shape: { theme: 'dark' | 'light', accent_color: '#hex' }.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("widget_configurations", "appearance", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("widget_configurations", "appearance");
  },
};
