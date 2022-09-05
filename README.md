# Nodemailer Email Server

## Prerequisite

- Have SMTP email account and address
- Have frontend or tool to POST data to URL hooks

## Usage

- `npm install`  
- `npm start`  

## Production deployment

- Make sur `ORIGIN` env varialbe corresponds to you domain (and port if needed)  
- Check running ports: `sudo lsof -i -P -n | grep LISTEN`  

## Deploy with docker

- Build: `docker build -t emailserver .`  
- Run:  `docker run -d -p3000:3000 emailserver`  

