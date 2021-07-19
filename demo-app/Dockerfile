FROM node:12-alpine
WORKDIR /usr/src/app
ENV PORT=8080

COPY demo-app/package*.json ./
RUN npx npm-check-updates -u
RUN npm install

COPY demo-app /usr/src/app
CMD npm start

EXPOSE $PORT
