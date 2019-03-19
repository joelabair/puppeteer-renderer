FROM node:10

USER root

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Install chromium package.
# Note: this installs the necessary libs to make the bundled version of Chromium that Pupppeteer
# installs, work.
RUN apt-get update \
    && apt-get install -yq  \
      gconf-service \
      libasound2 \
      libatk1.0-0 \
      libatk-bridge2.0-0 \
      libc6 \
      libcairo2 \
      libcups2 \
      libdbus-1-3 \
      libexpat1 \
      libfontconfig1 \
      libgcc1 \
      libgconf-2-4 \
      libgdk-pixbuf2.0-0 \
      libglib2.0-0 \
      libgtk-3-0 \
      libnspr4 \
      libpango-1.0-0 \
      libpangocairo-1.0-0 \
      libstdc++6 \
      libx11-6 \
      libx11-xcb1 \
      libxcb1 \
      libxcomposite1 \
      libxcursor1 \
      libxdamage1 \
      libxext6 \
      libxfixes3 \
      libxi6 \
      libxrandr2 \
      libxrender1 \
      libxss1 \
      libxtst6 \
      ca-certificates \
      fonts-liberation \
      libappindicator1 \
      libnss3 \
      lsb-release \
      xdg-utils \
      wget \
      chromium \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

#ENV CHROME_DEVEL_SANDBOX /usr/local/sbin/chrome-sandbox
ENV CHROME_DEVEL_SANDBOX /usr/lib/chromium/chrome-sandbox

RUN groupmod -g 988 node
RUN usermod -d /home/node -s /bin/nologin -u 988 -g 988 -G audio,video node
RUN install -onode -gnode -d /home/node
RUN install -onode -gnode -d /home/node/Downloads
RUN install -onode -gnode -d /opt/app

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

RUN npm install pm2 -g

USER node

COPY . /opt/app

RUN cd /opt/app && npm install --quiet --production
#
#USER root
#
#RUN cp /opt/app/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/chrome_sandbox /usr/local/sbin/chrome-sandbox \
#    && chown root:root /usr/local/sbin/chrome-sandbox \
#    && chmod 4755 /usr/local/sbin/chrome-sandbox

USER node

EXPOSE 3000

ENV NODE_FORKS 1

WORKDIR /opt/app

CMD dumb-init pm2 start src/index.js -i ${NODE_FORKS} --no-automation --no-pmx --no-daemon --no-vizion --no-color

# docker build -t joelabair/puppeteer .
