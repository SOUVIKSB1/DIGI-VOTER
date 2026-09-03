# Use Node 18 Alpine for smaller image
FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files from Backend
COPY Backend/package*.json ./

# Install production dependencies only
RUN npm ci --omit=dev

# Copy backend and frontend code
COPY Backend/ ./Backend/
COPY Frontend/ ./Frontend/

WORKDIR /app/Backend

# Expose port (Cloud Run / Render default)
EXPOSE 5002

# Set environment to production
ENV NODE_ENV=production
ENV PORT=5002

# Start the application
CMD ["npm", "start"]
