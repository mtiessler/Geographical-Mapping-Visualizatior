FROM node:20-alpine

WORKDIR /IV-ASSIGNMENT-2

COPY public/ /IV-ASSIGNMENT-2/public
COPY src/ /IV-ASSIGNMENT-2/src
COPY package.json /IV-ASSIGNMENT-2/


RUN npm install

COPY . .

EXPOSE 8000

CMD ["npm", "start", "--", "--port", "8000"]