# Build
FROM node:16
ENV NODE_ENV development

# RUN npm i --global pnpm
COPY package.json .
# COPY pnpm-lock.yaml .
# RUN pnpm i --ignore-scripts
RUN npm i
COPY . .
RUN npm run build

# Run Image
FROM node:16
WORKDIR /usr/src/app
ENV NODE_ENV production

# RUN npm i --global pnpm
COPY --from=0 package.json .
# COPY --from=0 pnpm-lock.yaml .
# RUN pnpm i --ignore-scripts
RUN npm i
COPY --from=0 lib lib

ENV IPFS_GATEWAY=https://ipfs.io/ipfs
CMD ["npm", "run", "startServer"]
