FROM node:14

RUN mkdir /app
WORKDIR /app


COPY ./package.json ./package-lock.json ./
RUN npm install


EXPOSE 3001