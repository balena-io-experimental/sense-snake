FROM resin/raspberrypi3-node:8.5

ENV INITSYSTEM on

WORKDIR /usr/src/app

COPY package.json .

RUN JOBS=MAX npm install --unsafe-perm --production

COPY . ./

RUN node --check src/app.js

CMD node src/app.js
