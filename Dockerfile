# Use an official Node.js image as a parent image
FROM node:18-alpine AS builder

# Set the working directory in the container to /app
WORKDIR /app

# Copy package.json and package-lock.json into the container at /app
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the rest of the project's files into the container at /app
COPY . .

# Build the TypeScript project
RUN npm run build

# Production image
FROM node:18-alpine

# Set the working directory to /app
WORKDIR /app

# Copy the build output and node_modules from the builder stage to the production image
COPY --from=builder /app/build /app/build
COPY --from=builder /app/node_modules /app/node_modules

# Set environment variables
ENV STABILITY_AI_API_KEY=your_api_key_here
ENV IMAGE_STORAGE_DIRECTORY=/tmp/stability-ai-images

# Create the image storage directory
RUN mkdir -p /tmp/stability-ai-images

# Expose port (if the application listens on a port)
# EXPOSE 3000

# Run the application
ENTRYPOINT ["node", "build/index.js"]