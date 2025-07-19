'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('clicks', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      urlId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'urls',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE'
      },
      ipAddress: {
        type: Sequelize.STRING(45), // IPv6 compatible
        allowNull: true
      },
      userAgent: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      referer: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      country: {
        type: Sequelize.STRING(2),
        allowNull: true
      },
      city: {
        type: Sequelize.STRING,
        allowNull: true
      },
      clickedAt: {
        allowNull: false,
        type: Sequelize.DATE,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Add indexes
    await queryInterface.addIndex('clicks', ['urlId']);
    await queryInterface.addIndex('clicks', ['clickedAt']);
    await queryInterface.addIndex('clicks', ['ipAddress']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('clicks');
  }
}; 