# Utiliza la imagen oficial de Node.js como base
FROM node:18 AS build

# Establece el directorio de trabajo
WORKDIR /app

# Copia el package.json y package-lock.json
COPY package*.json ./

# Instala las dependencias
RUN npm install js-yaml react-flow-renderer react-modal buffer

# Copia el resto del código de la aplicación
COPY . .

# Construye la aplicación
RUN npm run build

# Utiliza una imagen de Nginx para servir la aplicación construida
FROM nginx:alpine

# Copia los archivos de la construcción de la aplicación al directorio de Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Expone el puerto en el que Nginx está escuchando
EXPOSE 80

# Ejecuta Nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
