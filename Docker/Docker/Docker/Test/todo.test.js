const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/config/database');
const User = require('../src/models/User');
const Todo = require('../src/models/Todo');

let authToken;
let userId;

beforeAll(async () => {
  await sequelize.sync({ force: true });
  
  // Create test user
  const user = await User.create({
    username: 'todotest',
    email: 'todo@test.com',
    password: 'password123'
  });
  
  userId = user.id;
  
  // Login to get token
  const response = await request(app)
    .post('/api/auth/login')
    .send({
      email: 'todo@test.com',
      password: 'password123'
    });
  
  authToken = response.body.data.accessToken;
});

afterAll(async () => {
  await sequelize.close();
});

describe('Todo API', () => {
  describe('POST /api/todos', () => {
    it('should create a new todo', async () => {
      const todoData = {
        title: 'Test Todo',
        description: 'Test description',
        priority: 'high'
      };

      const response = await request(app)
        .post('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .send(todoData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.todo.title).toBe(todoData.title);
      expect(response.body.data.todo.userId).toBe(userId);
    });
  });

  describe('GET /api/todos', () => {
    it('should get all todos for user', async () => {
      const response = await request(app)
        .get('/api/todos')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('todos');
      expect(response.body.data).toHaveProperty('pagination');
    });
  });
});
