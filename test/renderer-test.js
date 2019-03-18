"use strict";

const { expect } = require("chai");
const createRenderer = require("../src/renderer");

let renderer = null;

describe("Renderer", function() {

  before(async function() {
    renderer = await createRenderer();
  });

  after(async function() {
    await renderer.close();
  });

  it("should return the rendered HTML", async function() {
    const html = await renderer.render("http://www.google.com");
    expect(html).to.be.a("string");
  });

  it("should return a buffer (PDF) of the HTML", async function() {
    const buffer = await renderer.pdf("http://www.google.com");
    expect(buffer).to.be.an.instanceof(Buffer);
  });

  it("should return a buffer (PNG) of the HTML", async function() {
    const buffer = await renderer.screenshot("http://www.google.com");
    expect(buffer).to.be.an.instanceof(Buffer);
  });
});
