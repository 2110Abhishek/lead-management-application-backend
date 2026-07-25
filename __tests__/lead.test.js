const request = require('supertest');
const app = require('../app');
const User = require('../models/User');
const Lead = require('../models/Lead');

require('./setup');

describe('Lead Routes', () => {
  let adminUser;
  let memberUser;
  let adminToken;
  let memberToken;

  beforeEach(async () => {
    adminUser = await User.create({
      name: 'Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    memberUser = await User.create({
      name: 'Member',
      email: 'member@test.com',
      password: 'password123',
      role: 'member',
    });

    const resAdmin = await request(app).post('/api/auth/login').send({ email: 'admin@test.com', password: 'password123' });
    adminToken = resAdmin.body.token;

    const resMember = await request(app).post('/api/auth/login').send({ email: 'member@test.com', password: 'password123' });
    memberToken = resMember.body.token;
  });

  it('should create a lead via public route', async () => {
    const response = await request(app)
      .post('/api/leads')
      .send({
        name: 'John Smith',
        email: 'john@tesla.com',
        phone: '123456789',
        company: 'Tesla',
        requirement: 'Website',
        budget: 10000,
      });

    expect(response.status).toBe(201);
    expect(response.body.company).toBe('Tesla');
  });

  it('should allow admin to assign a lead to a member', async () => {
    // Create Lead
    const lead = await Lead.create({
      name: 'Jane Doe',
      email: 'jane@space.com',
      phone: '987654321',
      company: 'SpaceX',
      requirement: 'App',
      budget: 20000,
    });

    // Admin updates lead assignment
    const response = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ assignedTo: memberUser._id });

    expect(response.status).toBe(200);
    expect(response.body.assignedTo).toBe(memberUser._id.toString());
  });

  it('should allow member to update lead status if assigned', async () => {
    const lead = await Lead.create({
      name: 'Jane Doe',
      email: 'jane@space.com',
      phone: '987654321',
      company: 'SpaceX',
      requirement: 'App',
      budget: 20000,
      assignedTo: memberUser._id,
    });

    const response = await request(app)
      .patch(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`)
      .send({ status: 'Contacted' });

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('Contacted');
  });

  it('should not allow member to delete a lead', async () => {
    const lead = await Lead.create({
      name: 'Jane Doe',
      email: 'jane@space.com',
      phone: '987654321',
      company: 'SpaceX',
      requirement: 'App',
      budget: 20000,
    });

    const response = await request(app)
      .delete(`/api/leads/${lead._id}`)
      .set('Authorization', `Bearer ${memberToken}`);

    expect(response.status).toBe(403);
  });
});
