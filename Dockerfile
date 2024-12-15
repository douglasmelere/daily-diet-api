# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Set environment variables (substitua pelos seus valores reais)
ENV DATABASE_URL=postgres://postgres:eea3046b89895d864734@daily-diet-api_daily-diet-db:5432/daily-diet-api
ENV DATABASE_CLIENT=pg

# Bundle app source
COPY . .

# Run migrations (knex)
RUN npm run knex -- migrate:latest

# Run build (caso você tenha um processo de build)
RUN npm run build

# Start the server using the production build
CMD [ "node", "/build/server.js" ]

# Exposing server port
EXPOSE 3000
