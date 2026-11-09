FROM node:18
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm install
COPY . .
RUN npx tsc --skipLibCheck --noEmitOnError false || true
EXPOSE 3001
CMD ["npm", "start"]
