FROM node:10

USER root

# See https://crbug.com/795759
RUN apt-get update && apt-get install -yq libgconf-2-4

ENV APT_KEY_DONT_WARN_ON_DANGEROUS_USAGE=1

# Install latest chrome package.
# Note: this installs the necessary libs to make the bundled version of Chromium that Pupppeteer
# installs, work.
RUN apt-get update && apt-get install -y wget --no-install-recommends \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update \
    && apt-get install -y google-chrome-stable \
      --no-install-recommends \
    && rm -rf /var/lib/apt/lists/* \
    && apt-get purge --auto-remove -y curl \
    && rm -rf /src/*.deb

# Uncomment to skip the chromium download when installing puppeteer. If you do,
# you'll need to launch puppeteer with:
#     browser.launch({executablePath: 'google-chrome-unstable'})
#ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD true

#ENV CHROME_DEVEL_SANDBOX /usr/local/sbin/chrome-sandbox
#ENV CHROME_DEVEL_SANDBOX /opt/google/chrome/chrome-sandbox

RUN groupmod -g 988 node
RUN usermod -d /home/node -s /bin/nologin -u 988 -g 988 -G audio,video node
RUN install -onode -gnode -d /home/node
RUN install -onode -gnode -d /home/node/Downloads
RUN install -onode -gnode -d /opt/app

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

#RUN npm install pm2 -g

USER node

COPY . /opt/app

RUN cd /opt/app && npm install --quiet --production

USER root

RUN cd /opt/app/node_modules/puppeteer/.local-chromium/linux-*/chrome-linux/ \
          && install -o root -g root -m 4755 chrome_sandbox /usr/local/sbin/chrome-sandbox

USER node

EXPOSE 3000

#ENV NODE_FORKS 1

ENV CHROME_DEVEL_SANDBOX /usr/local/sbin/chrome-sandbox

WORKDIR /opt/app

CMD dumb-init node src/index.js

# docker build -t joelabair/puppeteer .
