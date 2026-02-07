# Base leve
FROM node:20-alpine

# INSTALA O GHOSTSCRIPT (O Pulo do Gato)
RUN apk update && apk add --no-cache ghostscript

WORKDIR /app

# Instala dependências
COPY package*.json ./
RUN npm install

# Copia o código
COPY . .

# Build do Next.js
RUN npm run build

# Expõe a porta e roda
EXPOSE 3000
CMD ["npm", "start"]
