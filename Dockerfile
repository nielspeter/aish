# Use an official Node runtime as a parent image
FROM node:current

# Set the working directory inside the container to /opt/aish
WORKDIR /opt/aish

# Install any needed packages specified in package.json
COPY package*.json ./
RUN npm install

# Bundle app source inside Docker image
COPY . .

# Expose the port your application runs on (optional)
# EXPOSE 3000

# Run your application
CMD ["npm", "start"]