# Use Node 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy application code
COPY . .

# Expose port (Cloud Run uses 8080 by default)
EXPOSE 8080

# Set environment to production
ENV NODE_ENV=production
ENV PORT=8080

# Start the application
CMD ["npm", "start"]
