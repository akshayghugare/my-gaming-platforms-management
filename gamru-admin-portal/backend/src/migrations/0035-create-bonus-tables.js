"use strict";

/**
 * GAMRU-side bonus mirror of the SDLCGames bonus channel.
 *  - `bonuses`      : snapshots of SDLCGames bonus definitions, synced when a
 *                     rank pins a bonus id. Carries `source` (e.g. SDLCGAMES).
 *  - `user_bonuses` : a row per bonus a player CLAIMED on the games platform,
 *                     mirrored here (user_id, source, claim info).
 * Amount-type / status are stored as plain strings (no ENUM) so the snapshot
 * tolerates whatever SDLCGames sends without a migration.
 */
module.exports = {
  async up(qi, Sequelize) {
    const tables = (await qi.showAllTables()).map((t) =>
      typeof t === "string" ? t : t.tableName
    );
    const { UUID, UUIDV4, STRING, FLOAT, DATE } = Sequelize;
    const ts = {
      created_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
      updated_at: { type: DATE, allowNull: false, defaultValue: Sequelize.fn("NOW") },
    };

    if (!tables.includes("bonuses")) {
      await qi.createTable("bonuses", {
        id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
        external_bonus_id: { type: STRING(64), allowNull: false, unique: true },
        bonus_name: { type: STRING(150), allowNull: false },
        bonus_type: { type: STRING(60), allowNull: false, defaultValue: "BONUS_CASH" },
        amount: { type: FLOAT, allowNull: false, defaultValue: 0 },
        amount_type: { type: STRING(8), allowNull: false, defaultValue: "RM" },
        status: { type: STRING(16), allowNull: false, defaultValue: "ACTIVE" },
        source: { type: STRING(40), allowNull: false, defaultValue: "SDLCGAMES" },
        synced_at: { type: DATE, allowNull: true },
        ...ts,
      });
    }

    if (!tables.includes("user_bonuses")) {
      await qi.createTable("user_bonuses", {
        id: { type: UUID, defaultValue: UUIDV4, primaryKey: true },
        user_id: { type: STRING(120), allowNull: false },
        email: { type: STRING(180), allowNull: true },
        external_bonus_id: { type: STRING(64), allowNull: false },
        bonus_name: { type: STRING(150), allowNull: false, defaultValue: "" },
        source_type: { type: STRING(16), allowNull: false },
        source_id: { type: STRING(64), allowNull: false, defaultValue: "" },
        amount: { type: FLOAT, allowNull: false, defaultValue: 0 },
        amount_type: { type: STRING(8), allowNull: false, defaultValue: "RM" },
        status: { type: STRING(16), allowNull: false, defaultValue: "CLAIMED" },
        source: { type: STRING(40), allowNull: false, defaultValue: "SDLCGAMES" },
        claimed_at: { type: DATE, allowNull: true },
        ...ts,
      });
      await qi.addIndex("user_bonuses", ["user_id"]);
      await qi.addIndex("user_bonuses", ["external_bonus_id"]);
    }
  },

  async down(qi) {
    await qi.dropTable("user_bonuses");
    await qi.dropTable("bonuses");
  },
};
