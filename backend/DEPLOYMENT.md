# Deployment Guide

## Development Deployment

### Option 1: Local Development
```bash
# Setup
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt

# Run
python -m uvicorn app.main:app --reload
```

### Option 2: Using Start Scripts
```bash
# Linux/Mac
bash start.sh

# Windows
start.bat
```

## Production Deployment

### Option 1: Gunicorn + Nginx

1. **Setup Production Environment:**
```bash
pip install gunicorn
export ENVIRONMENT=production
export DATABASE_URL=your_production_db_url
```

2. **Run with Gunicorn:**
```bash
gunicorn -c gunicorn_config.py
```

3. **Nginx Configuration:**
```nginx
upstream schoolai {
    server 127.0.0.1:8000;
}

server {
    listen 80;
    server_name api.schoolai.com;

    location / {
        proxy_pass http://schoolai;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Option 2: Docker with Docker Compose

1. **Production Compose File:**
```bash
docker-compose -f docker-compose.prod.yml up -d
```

2. **Environment:**
```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://prod_user:prod_pass@prod_db:5432/schoolai_prod
```

### Option 3: Cloud Platforms

#### AWS EC2
```bash
# Launch Ubuntu instance
sudo apt-get update
sudo apt-get install python3.11 python3-pip postgresql-client

git clone your_repo
cd backend
pip install -r requirements.txt
pip install gunicorn

# Create systemd service
sudo nano /etc/systemd/system/schoolai.service
```

#### Heroku
```bash
heroku login
heroku create schoolai-api
git push heroku main
```

#### Google Cloud Run
```bash
gcloud run deploy schoolai-api \
  --source . \
  --platform managed \
  --region us-central1 \
  --set-env-vars DATABASE_URL=your_db_url
```

### Option 4: Kubernetes

1. **Build Image:**
```bash
docker build -t schoolai-api:1.0.0 .
```

2. **Deploy:**
```bash
kubectl apply -f k8s/deployment.yaml
```

## Database Setup

### PostgreSQL Setup
```bash
# Local
createdb schoolai
createuser schoolai_user
psql schoolai -c "ALTER USER schoolai_user WITH PASSWORD 'password';"

# Production
psql -h prod-db.example.com -U postgres
CREATE DATABASE schoolai_prod;
CREATE USER schoolai_prod_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE schoolai_prod TO schoolai_prod_user;
```

## Monitoring & Logging

### Health Check
```bash
curl http://api.schoolai.com/health
```

### Logs
```bash
# Docker
docker logs schoolai_api

# Systemd
journalctl -u schoolai -f

# Gunicorn
tail -f /var/log/schoolai/access.log
```

### Metrics
- Use Prometheus for metrics collection
- Use Grafana for dashboards
- Configure alerts for API failures

## Security Best Practices

1. **Environment Variables:**
```bash
export DATABASE_URL=postgresql://...
export SECRET_KEY=your-secret-key
export ENVIRONMENT=production
```

2. **HTTPS:**
- Use SSL/TLS certificates
- Redirect HTTP to HTTPS
- Use secure headers

3. **Database:**
- Use strong passwords
- Enable SSL for DB connections
- Regular backups
- Enable audit logging

4. **API Security:**
- Implement rate limiting
- Add API keys for sensitive endpoints
- CORS configuration
- SQL injection prevention (SQLAlchemy handles this)

## Backup Strategy

### Daily Backups
```bash
#!/bin/bash
pg_dump schoolai_prod | gzip > /backups/schoolai_$(date +%Y%m%d).sql.gz
```

### Cloud Backups
- AWS S3
- Google Cloud Storage
- Azure Blob Storage

## Performance Optimization

### Database Indexing
Already included for:
- school_id
- category
- timestamp
- status

### Caching
- Redis for API response caching
- Database query caching
- CDN for static files

### Load Testing
```bash
# Using Apache Bench
ab -n 1000 -c 100 http://localhost:8000/health

# Using wrk
wrk -t12 -c400 -d30s http://localhost:8000/health
```

## Scaling

### Horizontal Scaling
- Multiple API instances behind load balancer
- Read replicas for database
- Message queue (Celery/RabbitMQ) for async tasks

### Vertical Scaling
- Increase server resources
- Optimize queries
- Cache frequently accessed data

## Rollback Plan

```bash
# Keep previous versions
docker tag schoolai-api:1.0.0 schoolai-api:1.0.0-backup
docker pull schoolai-api:0.9.9
docker run -d schoolai-api:0.9.9
```

## Maintenance

### Regular Tasks
- Weekly backups verification
- Monthly security updates
- Quarterly performance review
- Monitor disk usage

### Scheduled Maintenance
- Off-peak hours (2-4 AM)
- Database optimization
- Log rotation
- Dependency updates

## Support & Debugging

### Common Issues

**Port already in use:**
```bash
lsof -i :8000
kill -9 <PID>
```

**Database connection failed:**
- Check DATABASE_URL
- Verify PostgreSQL is running
- Check network connectivity

**High memory usage:**
- Check for memory leaks
- Increase worker processes
- Enable swap

## References

- [FastAPI Deployment](https://fastapi.tiangolo.com/deployment/)
- [Gunicorn Documentation](https://gunicorn.org/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Docker Documentation](https://docs.docker.com/)
