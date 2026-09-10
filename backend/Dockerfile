FROM node:24-alpine AS build
WORKDIR /app
ENV DATABASE_URL="postgresql://placeholder:placeholder@localhost:5432/placeholder"
COPY package*.json ./
COPY prisma ./prisma
COPY prisma.config.ts ./prisma.config.ts
RUN npm install
COPY . .
RUN npm run build

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./package.json
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY --from=build /app/prisma.config.ts ./prisma.config.ts

EXPOSE 3000
CMD ["sh", "-c", "npx prisma migrate deploy && npx prisma db seed && node dist/main.js"]
