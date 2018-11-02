FROM node:alpine

WORKDIR /app

ADD package.json package-lock.json /app/

RUN npm install

ADD app.js /app/app.js

EXPOSE 3000

CMD node /app/app.js
