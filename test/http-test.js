
var request;
var app = require('../src/index.js');

const express = require("express");
const slowApp = express();

slowApp.get("/", (req, res) => {
  console.log("Timeout request initiated. Waiting 31 seconds...");
	setTimeout(() => res.send("You probably should have timed out by now."), 31000);
});
slowApp.listen(30000);

describe('puppeteer-renderer', function() {

  before(function(done) {
    app.on('listening', function(server) {
      request = require('supertest')(server);
      done();
    });
  });

  describe('HTTP', function(){
    it('shoud timeout', async function() {
      await request
        .get('/')
        .query({ type: 'any', url: 'http://localhost:30000' })
        .expect(500);
		});

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
