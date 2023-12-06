const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.use(chaiHttp);
const expect = chai.expect;

describe('API', () => {
  it('should return "Teste Concluido!" on / GET', async () => {
    const res = await chai.request(app).get('/');
    expect(res).to.have.status(200);
    expect(res.text).to.equal('Teste Concluido!');
  });
});
