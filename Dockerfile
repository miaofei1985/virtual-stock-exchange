FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY server/package*.json ./server/
RUN cd server && npm ci --production
COPY server/ ./server/
COPY --from=build /app/build ./build/

ENV PORT=3001
EXPOSE 3001
CMD ["node", "server/index.js"]
