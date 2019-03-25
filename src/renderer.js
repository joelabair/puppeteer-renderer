"use strict";

const puppeteer = require("puppeteer");

const chromiumArgs = [
  '--no-sandbox'
  ];

const launchOptions = {
  args: chromiumArgs,
  userDataDir: '/tmp',
  ignoreHTTPSErrors: true,
  timeout: 10000
};

class Renderer {
  constructor(browser) {
    this.browser = browser;
  }

  async createPage(url, options = {}) {
    const { timeout, waitUntil } = options;
    const page = await this.browser.newPage();
    await page.goto(url, {
      timeout: Number(timeout) || 60 * 1000,
      waitUntil: waitUntil || "networkidle0"
    });
    return page;
  }

  async render(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil } = options;
      page = await this.createPage(url, { timeout, waitUntil });
      const html = await page.content();
      return html;
    } catch(e) {
      await this.cleanUp();
      throw e;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async pdf(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil, ...extraOptions } = options;
      page = await this.createPage(url, { timeout, waitUntil });

      const {
        scale,
        displayHeaderFooter,
        printBackground,
        preferCSSPageSize,
        landscape
      } = extraOptions;

      const buffer = await page.pdf({
        ...extraOptions,
        scale: Number(scale || 1),
        paperWidth: Number(extraOptions.width || 0) || "8.5in",
        paperHeight: Number(extraOptions.height || 0) || "11in",
        preferCSSPageSize: preferCSSPageSize === "true",
        displayHeaderFooter: displayHeaderFooter === "true",
        printBackground: printBackground === "true",
        landscape: landscape === "true"
      });
      return buffer;

    } catch(e) {
      await this.cleanUp();
      throw e;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async screenshot(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil, ...extraOptions } = options;
      page = await this.createPage(url, { timeout, waitUntil });
      page.setViewport({
        width: Number(extraOptions.width || 800),
        height: Number(extraOptions.height || 600)
      });

      const { fullPage, omitBackground, imageType, quality } = extraOptions;
      const buffer = await page.screenshot({
        ...extraOptions,
        type: imageType || "png",
        quality:
          Number(quality) ||
          (imageType === undefined || imageType == "png" ? 0 : 100),
        fullPage: fullPage === "true",
        omitBackground: omitBackground === "true"
      });
      return buffer;

    } catch(e) {
      await this.cleanUp();
      throw e;
    } finally {
      if (page) {
        await page.close();
      }
    }
  }

  async cleanUp() {
    if (process.env.USE_CHROME_EXE) {
      launchOptions.executablePath = '/opt/google/chrome/google-chrome';
    }
    let browser = await puppeteer.launch(launchOptions);
    await this.browser.close();
    this.browser = browser;
  }

  async close() {
    await this.browser.close();
  }
}

async function create() {
  if (process.env.USE_CHROME_EXE) {
    launchOptions.executablePath = '/opt/google/chrome/google-chrome';
  }
  const browser = await puppeteer.launch(launchOptions);
  return new Renderer(browser);
}

module.exports = create;
