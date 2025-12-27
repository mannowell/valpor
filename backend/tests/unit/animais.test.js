const request = require('supertest');
const app = require('../../server'); // server.js should export the app for testing

describe('GET /api/silos/animais', () => {
  it('deve retornar a lista de animais por silo com percentual', async () => {
    const res = await request(app).get('/api/silos/animais');
    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('status', 'success');
    expect(res.body).toHaveProperty('data');
    expect(Array.isArray(res.body.data)).toBe(true);
    if (res.body.data.length > 0) {
      expect(res.body.data[0]).toHaveProperty('silo_id');
      expect(res.body.data[0]).toHaveProperty('numero');
      expect(res.body.data[0]).toHaveProperty('animais');
      expect(res.body.data[0]).toHaveProperty('percentual');
    }
  });
});