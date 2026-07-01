"use strict";

/**
 * Per-player participation in a mission / mission-bundle.
 *
 * gamru does not run the mission engine — the games platform does, and it knows
 * exactly who JOINED what. It pushes that here (clientAuth) so the operator
 * console can show an accurate "Participated" count per mission and per bundle.
 *
 * Keyed by ID, never by name, and scoped by `feature` so a mission's standalone
 * participation and a bundle's participation never bleed into each other:
 *   - feature   : "missions" | "mission-bundles"
 *   - entity_id : the gamification mission row id OR the mission-bundle row id
 *   - email     : stable per-player join key from the games platform
 *   - status    : IN_PROGRESS | COMPLETED | CLAIMED (latest known)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("mission_participants", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      feature: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      entity_id: {
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
      external_id: {
        type: Sequelize.STRING(120),
        allowNull: true,
      },
      status: {
        type: Sequelize.STRING(30),
        allowNull: true,
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

    await queryInterface.addIndex(
      "mission_participants",
      ["feature", "entity_id", "email"],
      { unique: true, name: "mission_participants_feature_entity_email_uq" }
    );
    await queryInterface.addIndex(
      "mission_participants",
      ["feature", "entity_id"],
      { name: "mission_participants_feature_entity_idx" }
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("mission_participants");
  },
};
