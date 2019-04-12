"use strict";

const puppeteer = require("puppeteer");

const chromiumArgs = [
  '--disable-accelerated-2d-canvas',
    '--disable-background-timer-throttling',
    '--disable-breakpad',
    '--disable-client-side-phishing-detection',
    '--disable-cloud-import',
    '--disable-default-apps',
    '--disable-extensions',
    '--disable-gesture-typing',
    '--disable-gpu',
    '--disable-hang-monitor',
    '--disable-infobars',
    '--disable-notifications',
    '--disable-offer-store-unmasked-wallet-cards',
    '--disable-offer-upload-credit-cards',
    '--disable-popup-blocking',
    '--disable-print-preview',
    '--disable-prompt-on-repost',
    '--disable-setuid-sandbox',
    '--disable-software-rasterizer',
    '--disable-speech-api',
    '--disable-sync',
    '--disable-tab-for-desktop-share',
    '--disable-translate',
    '--disable-voice-input',
    '--disable-wake-on-wifi',
    '--enable-async-dns',
    '--enable-simple-cache-backend',
    '--enable-tcp-fast-open',
    '--hide-scrollbars',
    '--media-cache-size=33554432',
    '--metrics-recording-only',
    '--mute-audio',
    '--no-default-browser-check',
    '--no-first-run',
    '--no-pings',
    '--no-sandbox',
    '--no-zygote',
    '--password-store=basic',
    '--prerender-from-omnibox=disabled',
    '--use-mock-keychain',
    '--single-process'
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
    let page = null, error = false;
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
      error = true;
      await this.cleanUp();
      throw e;
    } finally {
      if (page && !error) {
        await page.close();
      }
    }
  }

  async screenshot(url, options = {}) {
    let page = null, error = false;
    try {
      const { timeout, waitUntil, ...extraOptions } = options;
      const { fullPage, omitBackground, imageType, quality } = extraOptions;
      const viewport = {
        width: Number(extraOptions.width || 800),
        height: Number(extraOptions.height || 600),
        deviceScaleFactor: Number(extraOptions.deviceScaleFactor || 1)
      };
      const page = await this.browser.newPage();
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
      return buffer;
    } catch(e) {
      error = true;
      await this.cleanUp();
      throw e;
    } finally {
      if (page && !error) {
        await page.close();
      }
    }
  }

  async cleanUp() {
    if (process.env.USE_CHROME_EXE) {
      launchOptions.executablePath = '/opt/google/chrome/google-chrome';
    }

    try {
      await this.browser.close();
    } catch(i) {
      // ignore any close error
    }

    try {
      this.browser = await puppeteer.launch(launchOptions);
    } catch (e) {
      process.exit(1);
    }
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
