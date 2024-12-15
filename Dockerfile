# Base image
FROM node:18

# Create app directory
WORKDIR /usr/src/app

# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install app dependencies
RUN npm install

# Bundle app source
COPY . .

# Run build to compile TypeScript files (se necessário)
RUN npm run build

# Run migrations (knex)
RUN npm run knex -- migrate:latest

# Start the server using the production build
CMD [ "node", "/build/server.js" ]

# Exposing server port
EXPOSE 3000
