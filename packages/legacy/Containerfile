FROM debian:bookworm AS builder
RUN apt update && apt-get install -y nodejs npm build-essential
WORKDIR /app
COPY . .
RUN npm install
RUN npm run build
RUN npm prune --production

FROM node:23-bookworm-slim
WORKDIR /app
COPY --from=builder /app/build build/
COPY --from=builder /app/node_modules node_modules/
ENV DB=/app/data.ddb
COPY src/project/data.ddb /app/data.ddb
COPY package.json .
EXPOSE 3000
ENV NODE_ENV=production
CMD [ "node", "build" ]
