var expect = require('chai').expect;

var request;
var app = require('../src/index.js');

describe('puppeteer-renderer', function() {

  before(function(done) {
    app.on('listening', function(server) {
      request = require('supertest')(server);
      done();
    });
  });

  describe('HTTP', function(){
    it('can render a PDF', async function() {
      await request
        .get('/')
        .query({ type: 'pdf', url: 'https://www.google.com' })
        .expect('Content-Type', /pdf/)
        .expect('Content-Length', /^[1-9]/)
        .expect(200);
		});

    it('can render a PNG', async function() {
      await request
        .get('/')
        .query({ type: 'screenshot', url: 'https://www.google.com' })
        .expect('Content-Type', /png/)
        .expect('Content-Length', /^[1-9]/)
        .expect(200);
		});

    it('can render HTML', async function() {
      await request
        .get('/')
        .query({ type: 'html', url: 'https://www.google.com' })
        .expect('Content-Type', /html/)
        .expect('Content-Length', /^[1-9]/)
        .expect(200);
    });
  });
});
