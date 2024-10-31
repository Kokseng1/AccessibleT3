# Dockerfile for backend

# Use an official Node.js runtime as a parent image
FROM node:14

# Set the working directory in the container
WORKDIR /usr/src/app

COPY package*.json ./
RUN npm install
RUN npm install -g nodemon

# Copy package.json and package-lock.json
COPY package*.json ./

# Install the app dependencies
RUN npm install
RUN npm install sqlite3 --build-from-source=false


# Copy the rest of your backend code
COPY . .

# Expose the port your app runs on
EXPOSE 8800

# FROM --platform=linux/amd64 node:14


# Command to run your app
CMD ["nodemon", "index.js"]
