'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create a demo user
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    const users = await queryInterface.bulkInsert('users', [{
      email: 'demo@example.com',
      password: hashedPassword,
      username: 'demo_user',
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    }], { returning: true });

    const userId = users[0].id;

    // Create some demo URLs
    await queryInterface.bulkInsert('urls', [
      {
        originalUrl: 'https://www.google.com',
        shortCode: 'google',
        title: 'Google Search',
        description: 'The world\'s most popular search engine',
        userId: userId,
        isActive: true,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        originalUrl: 'https://github.com',
        shortCode: 'github',
        title: 'GitHub',
        description: 'Where the world builds software',
        userId: userId,
        isActive: true,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        originalUrl: 'https://stackoverflow.com',
        shortCode: 'so',
        title: 'Stack Overflow',
        description: 'Where developers learn, share, & build careers',
        userId: null, // Anonymous URL
        isActive: true,
        clickCount: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('urls', null, {});
    await queryInterface.bulkDelete('users', null, {});
  }
}; 