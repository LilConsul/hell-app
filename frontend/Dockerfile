FROM node:23-alpine3.20

WORKDIR /app

ENV PATH `/app/node_modules/.bin` to $PATH

COPY package*.json ./

# Due to compatibility issues with the React v19 should use the legacy-peer-deps flag
RUN npm install --legacy-peer-deps

COPY . .