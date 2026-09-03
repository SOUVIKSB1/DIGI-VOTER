# VoteVision AI — Production Hosting & Deployment Guide

This guide details all available options to deploy **VoteVision AI** to production, from free cloud platforms to production-grade containerized and virtual private server (VPS) setups.

---

## 📋 Overview of Deployment Options

| Method | Best For | Estimated Cost | Setup Complexity |
| :--- | :--- | :--- | :--- |
| **Render** *(Recommended)* | Quickest portfolio demo, automated Git push deploys | Free Tier / \$7/mo | 🟢 Very Low (1-Click) |
| **Railway** | Developer-friendly PaaS, instant environment variables | \$5/mo usage | 🟢 Very Low |
| **Docker & Docker Compose** | Local, self-hosted, or any cloud server (AWS, GCP, Azure) | Self-hosted | 🟡 Low |
| **AWS EC2 / DigitalOcean VPS** | High-traffic production with custom domain & Nginx | \$4 - \$12/mo | 🟠 Medium |
| **Google Cloud Run** | Serverless autoscaling container deployment | Pay per request | 🟡 Low-Medium |

---

## 🌟 Option 1: Deploying to Render (Recommended / 1-Click)

VoteVision AI includes a native [`render.yaml`](render.yaml) blueprint file for instant deployment.

### Steps:
1. **Push your code to GitHub**:
   ```bash
   git push -u origin main
   ```
2. **Sign up or log in** at [render.com](https://render.com).
3. In the Render Dashboard, click **New +** → **Blueprint**.
4. Connect your `DIGI-VOTER` GitHub repository.
5. Render will automatically detect `render.yaml`:
   - **Service Name**: `votevision-ai`
   - **Environment**: `Python`
   - **Build Command**: `pip install --upgrade pip && pip install -r Backend/requirements.txt`
   - **Start Command**: `cd Backend && gunicorn --bind 0.0.0.0:$PORT --workers 2 --threads 4 --timeout 120 "app:create_app('production')"`
   - **Health Check Path**: `/api/v1/health`
6. Click **Apply**.
7. Once built, your app will be live at `https://votevision-ai.onrender.com`!

---

## 🚂 Option 2: Deploying to Railway

1. Install Railway CLI or go to [railway.app](https://railway.app).
2. Click **New Project** → **Deploy from GitHub repo**.
3. Select `DIGI-VOTER`.
4. Railway will detect the included [`Procfile`](Procfile) and [`requirements.txt`](Backend/requirements.txt).
5. In **Variables**, add:
   - `FLASK_ENV` = `production`
   - `SECRET_KEY` = `generate-a-strong-random-key`
6. In **Settings** → **Networking**, click **Generate Domain** to get a public HTTPS URL.

---

## 🐳 Option 3: Containerized Deployment (Docker & Docker Compose)

The project includes a production [`Dockerfile`](Dockerfile) and [`docker-compose.yml`](docker-compose.yml).

### Local or Server Run:
```bash
# 1. Build and launch in detached mode
docker compose up -d --build

# 2. Check running container status
docker compose ps

# 3. View live server logs
docker compose logs -f votevision-web

# 4. Verify healthcheck
curl http://localhost:5001/api/v1/health
```

### Stopping the container:
```bash
docker compose down
```

---

## ☁️ Option 4: Production Linux VPS (AWS EC2 / DigitalOcean Droplet / Linode)

For a dedicated server with a custom domain, Nginx reverse proxy, and free SSL certificate.

### Prerequisites:
- Ubuntu 22.04 LTS or 24.04 LTS
- Domain name pointed to your server IP (A Record: `@` and `www`)

### Step-by-Step Setup:

#### 1. System Packages & Python Setup
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3-pip python3-venv git nginx certbot python3-certbot-nginx
```

#### 2. Clone the Repository
```bash
sudo mkdir -p /var/www
cd /var/www
sudo git clone git@github.com:SOUVIKSB1/DIGI-VOTER.git
sudo chown -R ubuntu:www-data /var/www/DIGI-VOTER
cd /var/www/DIGI-VOTER
```

#### 3. Virtual Environment & Dependencies
```bash
python3 -m venv .venv
source .venv/bin/activate
pip install --upgrade pip
pip install -r Backend/requirements.txt
```

#### 4. Configure Systemd Service
```bash
# Create logs directory
sudo mkdir -p /var/log/votevision
sudo chown -R ubuntu:www-data /var/log/votevision

# Copy systemd unit file
sudo cp deploy/votevision.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable votevision.service
sudo systemctl start votevision.service
sudo systemctl status votevision.service
```

#### 5. Configure Nginx Reverse Proxy
```bash
# Copy Nginx config
sudo cp deploy/nginx.conf /etc/nginx/sites-available/votevision

# Edit domain name
sudo nano /etc/nginx/sites-available/votevision
# Replace your-domain.com with your actual domain

# Enable site
sudo ln -s /etc/nginx/sites-available/votevision /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

#### 6. Enable Free HTTPS (Let's Encrypt SSL)
```bash
sudo certbot --nginx -d your-domain.com -d www.your-domain.com
```

#### 7. Future Updates (1-Command Deploy)
Make `deploy/deploy.sh` executable:
```bash
chmod +x deploy/deploy.sh
./deploy/deploy.sh
```

---

## ☁️ Option 5: Google Cloud Run (Serverless Container)

1. Ensure the Google Cloud SDK (`gcloud`) is installed.
2. Build and submit your container image:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/votevision-ai
   ```
3. Deploy to Cloud Run:
   ```bash
   gcloud run deploy votevision-ai \
     --image gcr.io/PROJECT_ID/votevision-ai \
     --platform managed \
     --region asia-south1 \
     --allow-unauthenticated \
     --port 5001 \
     --memory 1Gi \
     --set-env-vars FLASK_ENV=production
   ```

---

## 🔑 Environment Variables Reference

| Variable | Default | Purpose |
| :--- | :--- | :--- |
| `FLASK_ENV` | `production` | Set to `development` or `production` |
| `PORT` | `5001` | Port on which Gunicorn / Flask listens |
| `SECRET_KEY` | *(Built-in fallback)* | Random secret key used for session signing |
| `CORS_ORIGINS` | `*` | Allowed origin domains (set to your domain in strict environments) |

---

## 🩺 Monitoring & Health Checks

The backend provides a lightweight JSON healthcheck endpoint:
```
GET /api/v1/health
```

Expected Response (`200 OK`):
```json
{
  "database": "Lok Sabha 543 Constituencies Loaded",
  "models": {
    "calibrated_ensemble": "active",
    "gradient_boosting": "active",
    "logistic_regression": "active",
    "random_forest": "active"
  },
  "service": "VoteVision AI Engine",
  "status": "healthy",
  "version": "2.0.0"
}
```
All cloud providers (Render, AWS ALB, Cloud Run, Kubernetes, Docker) can use `/api/v1/health` for automated health checking and zero-downtime rolling deploys.
