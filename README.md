# Nodemailer Email Server

## Prerequisite

- Have SMTP email account and address
- Have frontend or tool to POST data to URL hooks

## Usage

- `npm install`  
- `npm start`  

### Production deployment

- Make sur `ORIGIN` env varialbe corresponds to you domain (and port if needed)  
- Check running ports: `sudo lsof -i -P -n | grep LISTEN`  

### Deploy with docker

- Build: `docker build -t emailserver .`  
- Run:  `docker run -d -p3000:3000 emailserver`  

### Deploy with Terraform on AWS Lambda

- Only the first time `terraform init`  
- create 'dev' workspace: `terraform workspace new dev`  
- use 'dev' workspace: `terraform workspace select dev`  
- list workspaces: `terraform workspace list`  
- Validate format: `terraform fmt`  
- Validate syntax: `terraform validate`  
- Plan deployment: `terraform plan -var-file="lambda.secrets.tfvars.json" -out="out.plan"`  
- Deploy stack: `terraform apply out.plan`  
- Destroy and clean stack: `terraform destroy -var-file="lambda.secrets.tfvars.json"`


## Use with Gmail

- https://miracleio.me/snippets/use-gmail-with-nodemailer
