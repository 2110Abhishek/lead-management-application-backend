require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');
const connectDB = require('./config/db');

const seedData = async () => {
  try {
    await connectDB();

    await User.deleteMany();

    const users = [
      {
        name: 'Admin User',
        email: 'admin@test.com',
        password: 'password123',
        role: 'admin',
      },
      {
        name: 'Rahul Sales',
        email: 'member@test.com',
        password: 'password123',
        role: 'member',
      },
    ];

    await User.create(users);

    console.log('Data Imported!');
    process.exit();
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

seedData();
