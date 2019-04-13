"use strict";

const genericPool = require('generic-pool');
const puppeteer = require("puppeteer");

const chromiumArgs = [
   '--proxy-server="direct://"',
    '--proxy-bypass-list=*',
    '--window-size=1920x1080',
    '--disable-accelerated-2d-canvas',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    //'--disable-setuid-sandbox',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ];

const launchOptions = {
  args: chromiumArgs,
  userDataDir: '/tmp',
  ignoreHTTPSErrors: true,
  timeout: 10000
};

if (process.env.USE_CHROME_EXE) {
  launchOptions.executablePath = '/opt/google/chrome/google-chrome';
}

const factory = {
  create: async function() {
    const browser = await puppeteer.launch(launchOptions);
    const page = await browser.newPage();
    return page;
  },
  destroy: async function(puppeteer) {
    try {
      await puppeteer.browser().close();
    } catch(e) {
      process.exit(1);
    }
  }
};

const browserPagePool = genericPool.createPool(factory, {
  max: 15,
  min: 5,
  maxWaitingClients: 50,
  softIdleTimeoutMillis: 15000,
  evictionRunIntervalMillis: 5000
});

class Renderer {

  async createPage(url, options = {}) {
    const { timeout, waitUntil } = options;
    const page = await browserPagePool.acquire();
    await page.goto(url, {
      timeout: Number(timeout) || 60 * 1000,
      waitUntil: waitUntil || "domcontentloaded"
    });
    await page.waitForSelector('body.phRendered');
    return page;
  }

  async render(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil } = options;
      page = await this.createPage(url, { timeout, waitUntil });
      const html = await page.content();
      await browserPagePool.destroy(page);
      return html;
    } catch(e) {
      await browserPagePool.destroy(page);
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

      await browserPagePool.destroy(page);
      return buffer;

    } catch(e) {
      await browserPagePool.destroy(page);
    }
  }

  async screenshot(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil, ...extraOptions } = options;
      const { fullPage, omitBackground, imageType, quality } = extraOptions;
      const viewport = {
        width: Number(extraOptions.width || 800),
        height: Number(extraOptions.height || 600)
      };
      const page = await browserPagePool.acquire();
      await page.setViewport(viewport);
      await page.goto(url, {
        timeout: Number(timeout) || 60 * 1000,
        waitUntil: waitUntil || "domcontentloaded"
      });
      await page.waitForSelector('body.phRendered');
      const buffer = await page.screenshot({
        ...extraOptions,
        type: imageType || "png",
        quality: Number(quality) || (imageType === undefined || imageType == "png" ? 0 : 100),
        fullPage: fullPage === "true",
        omitBackground: omitBackground === "true"
      });

      await browserPagePool.destroy(page);
      return buffer;

    }  catch(e) {
      await browserPagePool.destroy(page);
    }
  }

}

async function create() {
  return new Renderer();
}

module.exports = create;
