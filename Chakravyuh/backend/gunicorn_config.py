"""
Production Gunicorn configuration
Run: gunicorn -c gunicorn_config.py
"""

import os
import multiprocessing

bind = "0.0.0.0:8000"
workers = multiprocessing.cpu_count() * 2 + 1
worker_class = "uvicorn.workers.UvicornWorker"
worker_connections = 1000
timeout = 120
keepalive = 2

# Logging
access_log_format = '%(h)s %(l)s %(u)s %(t)s "%(r)s" %(s)s %(b)s "%(f)s" "%(a)s" %(D)s'
access_log = "-"
error_log = "-"
loglevel = "info"

# Server mechanics
daemon = False
pidfile = None
umask = 0
user = None
group = None
tmp_upload_dir = None

# Server hooks
def on_starting(server):
    print("🚀 SchoolAI Backend Starting (Production)")

def when_ready(server):
    print(f"✅ SchoolAI Backend Ready! Workers: {workers}")

def on_exit(server):
    print("🛑 SchoolAI Backend Stopping")

# Performance tuning
max_requests = 1000
max_requests_jitter = 50
