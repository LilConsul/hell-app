FROM node:23-alpine3.20

WORKDIR /app

ENV PATH `/app/node_modules/.bin` to $PATH

COPY package*.json ./

RUN npm install

COPY . .