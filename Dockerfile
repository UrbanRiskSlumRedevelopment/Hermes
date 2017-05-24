#Docker container for Hermes

FROM node:boron

RUN mkdir -p /usr/src/app
WORKDIR /usr/src/app

COPY package.json /usr/src/app/
RUN npm install

COPY app.js /usr/src/app
COPY .env /usr/src/app

EXPOSE 4001

CMD ["npm", "start"]
