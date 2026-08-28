FROM node:22-alpine
WORKDIR /app
COPY playable ./playable
ENV PORT=8080
EXPOSE 8080
CMD ["node", "playable/net-server.mjs"]
