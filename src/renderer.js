"use strict";

const genericPool = require('generic-pool');
const puppeteer = require("puppeteer");

process.setMaxListeners(128);

const chromiumArgs = [
    '--ignore-certificate-errors',
    '--disable-accelerated-2d-canvas',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-gpu',
    '--disable-dev-shm-usage',
    //'--disable-setuid-sandbox',
    '--no-default-browser-check',
    '--hide-scrollbars',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--single-process'
  ];

if (process.env.NODE_ENV === 'development') {
  chromiumArgs.push(
    '--disable-web-security',
    '--allow-running-insecure-content'
  );
}

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
    try {
      let browser = await puppeteer.launch(launchOptions);
      return await browser.newPage();
    } catch (e) {
      console.error(e);
      process.exit(1);
    }
  },
  destroy: async function(page) {
    try {
      const browser = page.browser();
      await page.close();
      await browser.close();
    } catch(e) {
      process.exit(1);
    }
  }
};

const browserPagePool = genericPool.createPool(factory, {
  max: 20,
  min: 4,
  maxWaitingClients: 128,
  softIdleTimeoutMillis: 3000,
  evictionRunIntervalMillis: 3000
});

class Renderer {

  async createPage(url, options = {}) {
    console.warn(url);
    const { timeout, waitUntil, waitForSelector } = options;
    const page = await browserPagePool.acquire();
    await page.goto(url, {
      timeout: Number(timeout) || 60 * 1000,
      waitUntil: waitUntil || "domcontentloaded"
    });
    if  (waitForSelector) {
      await page.waitForSelector('waitForSelector');
    }
    return page;
  }

  async render(url, options = {}) {
    let page = null, html;
    try {
      const { timeout, waitUntil } = options;
      page = await this.createPage(url, { timeout, waitUntil });
      html = await page.content();
      await browserPagePool.release(page);
    } catch(e) {
      if (page) {
        try {
          await browserPagePool.destroy(page);
        } catch (e) {
          page.browser().close().catch(e => console.error(e));
        }
      }
    }
    return html;
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

      await browserPagePool.release(page);
      return buffer;

    } catch(e) {
      if (page) {
        try {
          await browserPagePool.destroy(page);
        } catch (e) {
          page.browser().close().catch(e => console.error(e));
        }
      }
    }
  }

  async screenshot(url, options = {}) {
    let page = null;
    try {
      const { timeout, waitUntil, waitForSelector, ...extraOptions } = options;
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
      if  (waitForSelector) {
        await page.waitForSelector('waitForSelector');
      }
      const buffer = await page.screenshot({
        ...extraOptions,
        type: imageType || "png",
        quality: Number(quality) || (imageType === undefined || imageType == "png" ? 0 : 100),
        fullPage: fullPage === "true",
        omitBackground: omitBackground === "true"
      });

      await browserPagePool.release(page);
      return buffer;

    }  catch(e) {
      if (page) {
        try {
          await browserPagePool.destroy(page);
        } catch (e) {
          page.browser().close().catch(e => console.error(e));
        }
      }
    }
  }

}

async function create() {
  return new Renderer();
}

module.exports = create;
