'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('EventosProcessados', {
      delivery_id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false
      },
      status: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        comment: 'true = processado, false = não processado'
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('EventosProcessados');
  }
};