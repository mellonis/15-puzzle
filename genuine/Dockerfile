FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

RUN mkdir -p /data && chown node:node /data
VOLUME /data

USER node

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001
ENV DB_PATH=/data/genuine.db

CMD ["node", "src/index.js"]
