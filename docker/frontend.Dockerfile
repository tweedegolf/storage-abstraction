FROM node:10-stretch
USER node

RUN mkdir ./frontend/

EXPOSE 3002
WORKDIR /app
ENV NODE_ENV production

CMD node build/index.js
