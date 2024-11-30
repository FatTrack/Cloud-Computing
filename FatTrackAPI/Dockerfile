FROM node:18.17.1

# Set working directory
WORKDIR /app

# Copy the application code
COPY . .

RUN npm install

# Expose the application port
EXPOSE 3000

# Start the application
CMD [ "npm", "run", "start" ]
