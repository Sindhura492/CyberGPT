FROM node:20-alpine

WORKDIR /app

COPY ./frontend/package*.json ./
RUN npm ci

COPY ./frontend ./

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "dev", "--", "--host", "0.0.0.0", "--port", "3000"]