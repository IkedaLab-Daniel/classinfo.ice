# AWS EC2 Deployment Guide for ClassInfo

Complete guide to deploying the ClassInfo application (Node.js backend, Flask chat service, and React frontend) on AWS EC2.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    AWS EC2 Instance                     │
│                                                         │
│  ┌────────────┐  ┌──────────────┐  ┌───────────────┐  │
│  │   Nginx    │  │  Node.js API │  │ Flask Chat    │  │
│  │  (Reverse  │─▶│  Port 5001   │─▶│ Port 5002     │  │
│  │   Proxy)   │  │              │  │               │  │
│  │  Port 80   │  │ MongoDB      │  │ Gemini AI     │  │
│  └────────────┘  └──────────────┘  └───────────────┘  │
│                                                         │
│  ┌──────────────────────────────────────────────────┐  │
│  │  React Frontend (Static Files served by Nginx)  │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Prerequisites

- AWS Account
- Domain name (optional but recommended)
- MongoDB Atlas account (or install MongoDB on EC2)
- Gemini API key
- SSH client
- Basic knowledge of Linux commands

---

## Part 1: EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Log into AWS Console**
   - Navigate to EC2 Dashboard
   - Click "Launch Instance"

2. **Configure Instance**
   - **Name:** `classinfo-server`
   - **AMI:** Ubuntu Server 22.04 LTS (Free tier eligible)
   - **Instance Type:** t2.small or t2.medium (t2.micro may be too small)
   - **Key Pair:** Create new or select existing SSH key pair (download .pem file)
   - **Network Settings:**
     - Create security group
     - Allow SSH (port 22) from your IP
     - Allow HTTP (port 80) from anywhere
     - Allow HTTPS (port 443) from anywhere
     - Allow custom TCP (port 5001) from anywhere (temporary, for testing)

3. **Storage:** 20 GB gp3 (minimum)

4. **Launch Instance**

### Step 2: Connect to Your Instance

```bash
# Change key permissions (first time only)
chmod 400 /path/to/your-key.pem

# Connect via SSH
ssh -i /path/to/your-key.pem ubuntu@your-ec2-public-ip
```

### Step 3: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

---

## Part 2: Install Required Software

### Install Node.js 20.x

```bash
# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version
npm --version
```

### Install Python 3 and pip

```bash
# Install Python (usually pre-installed on Ubuntu)
sudo apt install -y python3 python3-pip python3-venv

# Verify installation
python3 --version
pip3 --version
```

### Install Nginx

```bash
sudo apt install -y nginx

# Start and enable Nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Verify Nginx is running
sudo systemctl status nginx
```

### Install PM2 (Process Manager)

```bash
sudo npm install -g pm2

# Enable PM2 to start on boot
pm2 startup systemd
# Run the command it outputs
```

### Install Git

```bash
sudo apt install -y git
```

---

## Part 3: Clone and Setup Application

### Step 1: Clone Repository

```bash
cd /home/ubuntu
git clone https://github.com/yourusername/ClassInfo.git
cd ClassInfo
```

### Step 2: Setup Node.js Server

```bash
cd server

# Install dependencies
npm install

# Create .env file
nano .env
```

**Server .env Configuration:**
```env
# MongoDB Configuration (Use MongoDB Atlas)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=classinfo

# Server Configuration
PORT=5001
NODE_ENV=production

# Chat Service Configuration
CHAT_SERVICE_URL=http://localhost:5002

# CORS Configuration
CLIENT_URL=http://your-ec2-public-ip

# JWT Configuration
JWT_SECRET=your-secure-random-string-here
JWT_EXPIRE=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=30000
RATE_LIMIT_MAX_REQUESTS=500
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 3: Setup Flask Chat Service

```bash
cd ../chat-service

# Create virtual environment
python3 -m venv venv

# Activate virtual environment
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
nano .env
```

**Chat Service .env Configuration:**
```env
GEMINI_API_KEY=your-gemini-api-key-here
NODE_API_URL=http://localhost:5001
FRONTEND_URL=http://your-ec2-public-ip
FLASK_ENV=production
PORT=5002
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Deactivate virtual environment for now
deactivate
```

### Step 4: Build React Frontend

```bash
cd ../client

# Install dependencies
npm install

# Create .env file for production build
nano .env.production
```

**Frontend .env.production:**
```env
VITE_API_URL=http://your-ec2-public-ip/api
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

```bash
# Build production bundle
npm run build

# This creates a 'dist' folder with optimized static files
```

---

## Part 4: Configure PM2 for Process Management

### Step 1: Create PM2 Ecosystem File

```bash
cd /home/ubuntu/ClassInfo
nano ecosystem.config.js
```

**ecosystem.config.js:**
```javascript
module.exports = {
  apps: [
    {
      name: 'classinfo-api',
      cwd: './server',
      script: 'server.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 5001
      }
    },
    {
      name: 'classinfo-chat',
      cwd: './chat-service',
      script: 'venv/bin/gunicorn',
      args: 'app:app --bind 0.0.0.0:5002 --workers 2',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        FLASK_ENV: 'production',
        PORT: 5002
      }
    }
  ]
};
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 2: Start Applications with PM2

```bash
# Start all applications
pm2 start ecosystem.config.js

# Save PM2 process list
pm2 save

# View running processes
pm2 list

# View logs
pm2 logs

# Monitor processes
pm2 monit
```

**Useful PM2 Commands:**
```bash
pm2 restart all          # Restart all apps
pm2 stop all            # Stop all apps
pm2 delete all          # Delete all apps from PM2
pm2 restart classinfo-api  # Restart specific app
pm2 logs classinfo-api  # View logs for specific app
```

---

## Part 5: Configure Nginx as Reverse Proxy

### Step 1: Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/classinfo
```

**Nginx Configuration:**
```nginx
server {
    listen 80;
    server_name your-ec2-public-ip;  # or your domain name

    # React Frontend
    location / {
        root /home/ubuntu/ClassInfo/client/dist;
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "no-cache, must-revalidate";
    }

    # Node.js API Proxy
    location /api/ {
        proxy_pass http://localhost:5001/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Flask Chat Service Proxy (optional direct access)
    location /chat-api/ {
        proxy_pass http://localhost:5002/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 90;
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/json;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

**Save and exit:** `Ctrl+X`, then `Y`, then `Enter`

### Step 2: Enable Site and Restart Nginx

```bash
# Create symbolic link
sudo ln -s /etc/nginx/sites-available/classinfo /etc/nginx/sites-enabled/

# Remove default site
sudo rm /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Part 6: Setup MongoDB Atlas

### Step 1: Create MongoDB Atlas Cluster

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a free cluster
3. Create database user with username and password
4. Whitelist your EC2 instance IP address (or 0.0.0.0/0 for anywhere)
5. Get connection string

### Step 2: Update Server .env

```bash
cd /home/ubuntu/ClassInfo/server
nano .env
```

Update `MONGODB_URI` with your Atlas connection string:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/?retryWrites=true&w=majority
```

### Step 3: Seed Database (Optional)

```bash
# Restart the API to connect to MongoDB
pm2 restart classinfo-api

# Seed database
npm run seed
```

---

## Part 7: Security Hardening

### Step 1: Setup Firewall (UFW)

```bash
# Enable UFW
sudo ufw enable

# Allow SSH
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Check status
sudo ufw status
```

### Step 2: Setup SSL with Let's Encrypt (If using domain)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Follow prompts
# Certbot will automatically configure Nginx for HTTPS
```

**Auto-renewal test:**
```bash
sudo certbot renew --dry-run
```

### Step 3: Update Security Group Rules

Go to AWS Console → EC2 → Security Groups:
- Remove port 5001 access (no longer needed)
- Keep only ports 22, 80, 443

---

## Part 8: Monitoring and Maintenance

### View Application Logs

```bash
# PM2 logs
pm2 logs

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor System Resources

```bash
# Install htop
sudo apt install -y htop

# View resource usage
htop

# Check disk usage
df -h

# Check memory usage
free -h
```

### Backup Strategy

```bash
# Create backup script
nano /home/ubuntu/backup.sh
```

**backup.sh:**
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR

# Backup application code
tar -czf $BACKUP_DIR/classinfo_$DATE.tar.gz /home/ubuntu/ClassInfo

# Keep only last 7 backups
find $BACKUP_DIR -name "classinfo_*.tar.gz" -mtime +7 -delete

echo "Backup completed: classinfo_$DATE.tar.gz"
```

```bash
# Make executable
chmod +x /home/ubuntu/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ubuntu/backup.sh >> /home/ubuntu/backup.log 2>&1
```

---

## Part 9: Deployment Updates

### Deploy Code Updates

```bash
cd /home/ubuntu/ClassInfo

# Pull latest changes
git pull origin main

# Update Node.js server
cd server
npm install
pm2 restart classinfo-api

# Update Flask chat service
cd ../chat-service
source venv/bin/activate
pip install -r requirements.txt
deactivate
pm2 restart classinfo-chat

# Update React frontend
cd ../client
npm install
npm run build
sudo systemctl restart nginx
```

### Zero-Downtime Deployments

```bash
# Use PM2 reload instead of restart
pm2 reload ecosystem.config.js

# Or reload individual apps
pm2 reload classinfo-api
pm2 reload classinfo-chat
```

---

## Part 10: Testing the Deployment

### Test Backend API

```bash
# Test health endpoint
curl http://your-ec2-ip/api/health

# Test schedules endpoint
curl http://your-ec2-ip/api/schedules

# Test chat endpoint
curl -X POST http://your-ec2-ip/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, what can you help me with?"}'
```

### Test Frontend

Open in browser:
```
http://your-ec2-ip
```

Or with domain:
```
https://yourdomain.com
```

---

## Troubleshooting

### Issue: Cannot connect to MongoDB

**Solution:**
```bash
# Check MongoDB Atlas IP whitelist
# Check connection string in .env file
# Verify MongoDB Atlas cluster is running
# Check server logs: pm2 logs classinfo-api
```

### Issue: Nginx 502 Bad Gateway

**Solution:**
```bash
# Check if backend services are running
pm2 list

# Check backend logs
pm2 logs

# Restart services
pm2 restart all

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Issue: React app not loading

**Solution:**
```bash
# Verify build completed successfully
cd /home/ubuntu/ClassInfo/client
npm run build

# Check if dist folder exists
ls -la dist/

# Verify Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### Issue: Out of memory

**Solution:**
```bash
# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Make permanent
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Reduce PM2 memory limits in ecosystem.config.js
```

### Issue: Disk space full

**Solution:**
```bash
# Check disk usage
df -h

# Clean PM2 logs
pm2 flush

# Clean system logs
sudo journalctl --vacuum-time=7d

# Clean package caches
sudo apt clean
sudo apt autoremove
```

---

## Cost Optimization

### Free Tier Eligible Setup

- **EC2:** t2.micro (750 hours/month free for first year)
- **MongoDB:** Atlas M0 Sandbox (512 MB, free forever)
- **Data Transfer:** 15 GB out/month free
- **SSL:** Let's Encrypt (free)

### Beyond Free Tier

**Estimated Monthly Costs:**
- t2.small (recommended): ~$17/month
- t2.medium (higher traffic): ~$34/month
- Elastic IP: Free if attached to running instance
- Data transfer: ~$0.09/GB after free tier

---

## Production Checklist

- [ ] EC2 instance launched and configured
- [ ] Security group properly configured
- [ ] Node.js, Python, Nginx installed
- [ ] Application code cloned and configured
- [ ] Environment variables set correctly
- [ ] MongoDB Atlas cluster created and connected
- [ ] PM2 configured and applications running
- [ ] Nginx configured as reverse proxy
- [ ] Frontend built and served by Nginx
- [ ] SSL certificate installed (if using domain)
- [ ] Firewall (UFW) configured
- [ ] Backup script created and scheduled
- [ ] Monitoring tools installed
- [ ] All endpoints tested successfully
- [ ] DNS configured (if using domain)

---

## Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [MongoDB Atlas Documentation](https://docs.atlas.mongodb.com/)
- [PM2 Documentation](https://pm2.keymetrics.io/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)

---

## Support and Maintenance

For ongoing maintenance:
1. Monitor PM2 logs daily: `pm2 logs`
2. Check system resources weekly: `htop`, `df -h`
3. Update system packages monthly: `sudo apt update && sudo apt upgrade`
4. Review Nginx logs for errors
5. Monitor MongoDB Atlas usage
6. Backup database regularly

---

**Deployment Date:** ___________  
**Deployed By:** ___________  
**EC2 Instance ID:** ___________  
**Public IP:** ___________  
**Domain:** ___________
