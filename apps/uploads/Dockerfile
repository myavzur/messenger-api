FROM node:18.15.0

WORKDIR /usr/src/app

COPY package*.json .

RUN npm ci

COPY . .
