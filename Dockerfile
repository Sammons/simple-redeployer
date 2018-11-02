FROM node:10

WORKDIR /app

ADD package.json package-lock.json /app/

RUN npm install

ADD app.js /app/
