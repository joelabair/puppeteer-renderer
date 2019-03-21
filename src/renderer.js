"use strict";

const puppeteer = require("puppeteer");

const chromiumArgs = [
  '--deterministic-fetch',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-cloud-import',
  '--disable-default-apps',
  '--disable-dev-shm-usage',
  '--disable-extensions',
  '--disable-gesture-typing',
  '--num-raster-threads 4',
  '--disable-infobars',
  '--disable-notifications',
  '--font-render-hinting=medium',
  '--disable-offer-store-unmasked-wallet-cards',
  '--disable-offer-upload-credit-cards',
  '--disable-popup-blocking',
  '--disable-print-preview',
  '--disable-prompt-on-repost',
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
  '--no-zygote',
  '--no-pings',
  '--no-sandbox',
  '--single-process'
];

class Renderer {
  constructor(browser) {
    this.browser = browser;
  }

  async createPage(url, options = {}) {
    const { timeout, waitUntil } = options;
    const page = await this.browser.newPage();
    await page.goto(url, {
      timeout: Number(timeout) || 30 * 1000,
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
    let browser = await puppeteer.launch({
      //executablePath: '/opt/google/chrome/google-chrome',
      args: chromiumArgs,
      ignoreHTTPSErrors: true,
      timeout: 10000
    });
    await this.browser.close();
    this.browser = browser;
  }

  async close() {
    await this.browser.close();
  }
}

async function create() {
  const browser = await puppeteer.launch({
    //executablePath: '/opt/google/chrome/google-chrome',
    args: chromiumArgs,
    userDataDir: '/tmp',
    ignoreHTTPSErrors: true,
    timeout: 10000
  });
  return new Renderer(browser);
}

module.exports = create;
