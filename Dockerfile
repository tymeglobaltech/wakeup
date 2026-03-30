FROM node:20-alpine

WORKDIR /app

# Install dependencies first (cached layer — only re-runs if package files change)
COPY package*.json ./
RUN npm ci --omit=dev

# Copy application files
COPY server.js ./
COPY public/ ./public/
COPY TGT.png WakeUp.png ./

EXPOSE 3000

CMD ["node", "server.js"]
