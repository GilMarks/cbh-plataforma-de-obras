FROM node:22-alpine

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm && pnpm install --frozen-lockfile

COPY . .

ARG VITE_API_URL=http://localhost:8000/api
RUN echo "VITE_API_URL=${VITE_API_URL}" > .env

EXPOSE 5173

CMD ["pnpm", "dev", "--host", "0.0.0.0"]
