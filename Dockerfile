FROM zenato/puppeteer

USER root

RUN groupmod -g 988 node
RUN usermod -d /home/node -s /bin/nologin -u 988 -g 988 node
RUN install -onode -gnode -d /home/node
RUN install -onode -gnode -d /opt/app

USER node

COPY . /opt/app

RUN cd /opt/app && npm install --quiet

EXPOSE 3000

WORKDIR /opt/app

CMD npm run start
