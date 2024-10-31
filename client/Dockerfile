# Use the official Node.js image to build the app.
FROM node:14 as build

# Set the working directory.
WORKDIR /usr/src/app

# Copy package.json and package-lock.json.
COPY package*.json ./

# Install frontend dependencies.
RUN npm install

# Copy the rest of your application code.
COPY . .

# Build the React app.
RUN npm run build

# Use a web server to serve the build files.
FROM nginx:alpine

# Copy the build files from the previous stage to the nginx html directory.
COPY --from=build /usr/src/app/build /usr/share/nginx/html

# Expose the port for the web server.
EXPOSE 80

# Start the NGINX server.
CMD ["nginx", "-g", "daemon off;"]
