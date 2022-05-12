FROM node:latest

WORKDIR /app

COPY . .
RUN npm i

# RUN /bin/sh -c "cd frontend;npm run build"

EXPOSE 3000

RUN adduser -D user
USER user

CMD ["node", "app.js"]
