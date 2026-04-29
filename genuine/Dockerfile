FROM node:24-alpine

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

COPY src ./src

USER node

EXPOSE 3001
ENV NODE_ENV=production
ENV PORT=3001

CMD ["node", "src/index.js"]
