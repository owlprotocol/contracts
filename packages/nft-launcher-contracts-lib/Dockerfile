# Build
FROM node:16
ENV NODE_ENV development

COPY package.json .
RUN npm i
COPY . .
RUN npm run build

# Run Image
FROM node:16
WORKDIR /usr/src/app
ENV NODE_ENV production

COPY --from=0 package.json .
RUN npm i
COPY --from=0 lib lib

ENV IPFS_GATEWAY=https://ipfs.io/ipfs
EXPOSE 8000
CMD ["npm", "run", "startServer"]
