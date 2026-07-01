"use strict";

/**
 * Make campaigns actually deliverable.
 *
 * 1. `campaigns` gains the fields the delivery engine needs: which template to
 *    render (`template_id`), which channel to send on (`channel`), when to send
 *    (`schedule_at`) and when it last ran (`last_run_at`).
 *
 * 2. `player_campaign_history` becomes the real on-site INBOX store (it existed
 *    but was never written to). It gains `campaign_id` (which campaign produced
 *    the message), `body` (the rendered message the player reads) and `read_at`
 *    (when the player opened it). Each row = one delivered message to one player.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("campaigns", "template_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn("campaigns", "channel", {
      type: Sequelize.STRING(20),
      allowNull: true,
    });
    await queryInterface.addColumn("campaigns", "schedule_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("campaigns", "last_run_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn("player_campaign_history", "campaign_id", {
      type: Sequelize.UUID,
      allowNull: true,
    });
    await queryInterface.addColumn("player_campaign_history", "body", {
      type: Sequelize.TEXT,
      allowNull: true,
    });
    await queryInterface.addColumn("player_campaign_history", "read_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex("player_campaign_history", ["campaign_id"]);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex("player_campaign_history", ["campaign_id"]);
    await queryInterface.removeColumn("player_campaign_history", "read_at");
    await queryInterface.removeColumn("player_campaign_history", "body");
    await queryInterface.removeColumn("player_campaign_history", "campaign_id");
    await queryInterface.removeColumn("campaigns", "last_run_at");
    await queryInterface.removeColumn("campaigns", "schedule_at");
    await queryInterface.removeColumn("campaigns", "channel");
    await queryInterface.removeColumn("campaigns", "template_id");
  },
};
