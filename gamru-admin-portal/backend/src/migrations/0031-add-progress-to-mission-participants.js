"use strict";

/**
 * Promote `mission_participants` from an aggregate "who joined" table to the
 * per-player mission PROGRESS table of record.
 *
 * GAMRU is now the single source of truth for mission progress: it runs the
 * mission engine (objective ticking, completion, claim) and stores the result
 * here. The games platform forwards gameplay events and caches the response —
 * it no longer computes progress.
 *
 * New columns:
 *   - progress     : current objective counter toward `target`
 *   - target       : objective target snapshot (from the mission's data blob)
 *   - period_key   : participation TRACK — "GAMRU" (standalone Missions tab) or
 *                    "B<bundleId>" for an independent bundle track. Mirrors the
 *                    games engine so one mission can progress on several tracks.
 *   - meta         : objective + display snapshot taken at join time
 *   - completed_at : when progress first reached target
 *   - claimed_at   : when the reward was claimed
 *
 * The unique key gains `period_key` so the same (feature, entity_id, email) can
 * run independently on the standalone track and each bundle track.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("mission_participants", "progress", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("mission_participants", "target", {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    });
    await queryInterface.addColumn("mission_participants", "period_key", {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: "GAMRU",
    });
    await queryInterface.addColumn("mission_participants", "meta", {
      type: Sequelize.JSONB,
      allowNull: true,
    });
    await queryInterface.addColumn("mission_participants", "completed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });
    await queryInterface.addColumn("mission_participants", "claimed_at", {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Re-key the uniqueness on the participation TRACK. Existing rows already
    // default to period_key = 'GAMRU', so the new index is safe to add.
    await queryInterface.removeIndex(
      "mission_participants",
      "mission_participants_feature_entity_email_uq"
    );
    await queryInterface.addIndex(
      "mission_participants",
      ["feature", "entity_id", "email", "period_key"],
      {
        unique: true,
        name: "mission_participants_feature_entity_email_track_uq",
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeIndex(
      "mission_participants",
      "mission_participants_feature_entity_email_track_uq"
    );
    await queryInterface.addIndex(
      "mission_participants",
      ["feature", "entity_id", "email"],
      { unique: true, name: "mission_participants_feature_entity_email_uq" }
    );
    await queryInterface.removeColumn("mission_participants", "claimed_at");
    await queryInterface.removeColumn("mission_participants", "completed_at");
    await queryInterface.removeColumn("mission_participants", "meta");
    await queryInterface.removeColumn("mission_participants", "period_key");
    await queryInterface.removeColumn("mission_participants", "target");
    await queryInterface.removeColumn("mission_participants", "progress");
  },
};
