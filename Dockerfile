FROM zenato/puppeteer

USER root

RUN groupmod -g 988 node
RUN usermod -d /home/node -s /bin/nologin -u 988 -g 988 node
RUN install -onode -gnode -d /home/node
RUN install -onode -gnode -d /opt/app

ADD https://github.com/Yelp/dumb-init/releases/download/v1.2.2/dumb-init_1.2.2_amd64 /usr/local/bin/dumb-init
RUN chmod +x /usr/local/bin/dumb-init

USER node

COPY . /opt/app

RUN cd /opt/app && npm install --quiet --production

EXPOSE 3000

WORKDIR /opt/app

CMD dumb-init node src/index.js

# docker build -t joelabair/puppeteer .
