FROM node:12
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

FROM node:12-alpine
WORKDIR /usr/src/app
COPY --from=0 package*.json ./
RUN npm install --only=production
COPY --from=0 lib/ .
CMD ["npm", "start"]