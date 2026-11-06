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

# AWS Lambda Web Adapter: lets this normal web server run inside Lambda. Outside Lambda
# (docker compose) it does nothing. It forwards to PORT 3000 (AWS_LWA_PORT is set in Terraform).
COPY --from=public.ecr.aws/awsguru/aws-lambda-adapter:0.9.1 /lambda-adapter /opt/extensions/lambda-adapter

# RDS CA bundle, used on AWS (DB_SSL_CA) so the database connection is encrypted AND verified.
ADD https://truststore.pki.rds.amazonaws.com/global/global-bundle.pem /app/rds-ca.pem

EXPOSE 3000
# Only start the server. Migrations and seed are NOT run here (they would run on every Lambda
# cold start). Locally, docker-compose.yml overrides this command to migrate and seed first.
CMD ["node", "dist/main.js"]
