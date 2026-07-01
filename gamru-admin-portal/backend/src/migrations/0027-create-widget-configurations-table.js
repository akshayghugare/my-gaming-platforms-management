"use strict";

/**
 * Embeddable iframe widgets created by an admin for a client.
 *
 *   - client_id      : owning clientConfig row (auth key derives from it)
 *   - name           : human-readable widget name
 *   - type           : one of the supported widget types (mission, tournament…)
 *   - allowed_domains: optional whitelist of hostnames allowed to embed it
 *   - status         : ACTIVE / INACTIVE — soft gate without deletion
 *   - expiry_date    : optional; the widget stops rendering after this date
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("widget_configurations", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      client_id: {
        type: Sequelize.UUID,
        allowNull: false,
        references: { model: "clientConfig", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      },
      name: {
        type: Sequelize.STRING(120),
        allowNull: false,
      },
      type: {
        type: Sequelize.STRING(40),
        allowNull: false,
      },
      allowed_domains: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM("ACTIVE", "INACTIVE"),
        allowNull: false,
        defaultValue: "ACTIVE",
      },
      expiry_date: {
        type: Sequelize.DATE,
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

    await queryInterface.addIndex("widget_configurations", ["client_id", "type"]);
    await queryInterface.addIndex("widget_configurations", ["status"]);
  },

  async down(queryInterface) {
    await queryInterface.dropTable("widget_configurations");
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS "enum_widget_configurations_status";'
    );
  },
};
