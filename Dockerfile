# Build
FROM node:14
ENV NODE_ENV development

RUN npm i --global pnpm
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm i
COPY . .
RUN npm run build

# Run Image
FROM node:14-alpine
WORKDIR /usr/src/app
ENV NODE_ENV production
ENV MINIMUM_BALANCE 0.2
ENV TARGET_BALANCE 10

RUN npm i --global pnpm
COPY --from=0 package.json .
COPY --from=0 pnpm-lock.yaml .
RUN pnpm i
COPY --from=0 lib lib
CMD ["npm", "start"]
