const request = require('supertest');
const app = require('../../server');

describe('POST /api/notify/test', () => {
  it('deve retornar 400 para channel inválido', async () => {
    const res = await request(app).post('/api/notify/test').send({ channel: 'invalid' });
    expect(res.statusCode).toBe(400);
    expect(res.body).toHaveProperty('success', false);
  });
});