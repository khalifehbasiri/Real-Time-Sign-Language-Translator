# Deployment Guide (Docker + AWS EC2)

This document describes a simple production deployment flow for the Flask inference API.

## Prerequisites

- AWS account
- EC2 instance (Ubuntu recommended)
- Security group rule allowing inbound TCP `5000` (or proxy through `80/443`)
- Docker installed on EC2
- SSH key for instance access

## 1) Build Backend Docker Image Locally

From `sign-language-alphabet/`:

```bash
docker build -t sign-translator-api:latest .
```

## 2) Push Image (Option A: Docker Hub)

```bash
docker tag sign-translator-api:latest <dockerhub-username>/sign-translator-api:latest
docker push <dockerhub-username>/sign-translator-api:latest
```

## 3) Run on EC2

SSH into your EC2 instance:

```bash
ssh -i /path/to/key.pem ubuntu@<ec2-public-ip>
```

Install Docker if needed:

```bash
sudo apt update
sudo apt install -y docker.io
sudo systemctl enable docker
sudo systemctl start docker
```

Pull and run:

```bash
sudo docker pull <dockerhub-username>/sign-translator-api:latest
sudo docker run -d --name sign-translator-api -p 5000:5000 <dockerhub-username>/sign-translator-api:latest
```

## 4) Health Check

```bash
curl http://<ec2-public-ip>:5000/
```

Expected response: API welcome/status message.

## 5) Point Frontend API URL to EC2

Update `frontend/src/services/api.js`:

```js
const API_URL = "http://<ec2-public-ip>:5000";
```

Rebuild/redeploy frontend after this change.

## Optional Hardening

- Put Flask behind Nginx + HTTPS (Let's Encrypt)
- Use a process supervisor / orchestration (systemd, ECS, etc.)
- Restrict CORS to your frontend domain
- Add request logging and monitoring
