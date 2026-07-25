const request = require('supertest');
const app = require('../app');
const User = require('../models/User');

require('./setup');

describe('Auth & User Routes', () => {
  let adminToken;
  let memberToken;

  beforeEach(async () => {
    // Create an Admin user
    const adminUser = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });

    // Create a Member user
    const memberUser = await User.create({
      name: 'Member',
      email: 'member@test.com',
      password: 'password123',
      role: 'member',
    });

    // Login Admin
    const resAdmin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });
    adminToken = resAdmin.body.token;

    // Login Member
    const resMember = await request(app)
      .post('/api/auth/login')
      .send({ email: 'member@test.com', password: 'password123' });
    memberToken = resMember.body.token;
  });

  it('should authenticate user and return token', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@test.com', password: 'password123' });

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
  });

  it('should allow admin to register a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'New Member',
        email: 'newmember@test.com',
        password: 'password123',
        role: 'member',
      });

    expect(response.status).toBe(201);
    expect(response.body.email).toBe('newmember@test.com');
  });

  it('should not allow member to register a new user', async () => {
    const response = await request(app)
      .post('/api/users')
      .set('Authorization', `Bearer ${memberToken}`)
      .send({
        name: 'Another Member',
        email: 'another@test.com',
        password: 'password123',
      });

    expect(response.status).toBe(403);
  });
});
