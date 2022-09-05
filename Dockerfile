FROM node:16-alpine

WORKDIR /usr/app
COPY src /usr/app/src
COPY package*.json .
COPY main.js .
COPY .env .

RUN npm install --omit=dev

EXPOSE 3000

CMD ["npm", "start"]
