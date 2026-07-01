"use strict";

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("email_smtp", {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      // Which flow this SMTP config powers (e.g. register, reward)
      type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      host: { type: Sequelize.STRING(255), allowNull: true },
      port: { type: Sequelize.INTEGER, allowNull: true },
      username: { type: Sequelize.STRING(255), allowNull: true },
      password: { type: Sequelize.TEXT, allowNull: true },
      from_email: { type: Sequelize.STRING(255), allowNull: true },
      // Master toggle — only sends mail for this flow when enabled
      is_enabled: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
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
  },

  async down(queryInterface) {
    await queryInterface.dropTable("email_smtp");
  },
};
