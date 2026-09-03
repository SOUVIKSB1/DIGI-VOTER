"""
Security Middleware and Sanitization Utilities
"""
import time
from collections import defaultdict
from functools import wraps
from flask import request, jsonify

# Simple in-memory rate limiter per IP address
# Limit: default 120 requests per minute
_RATE_LIMIT_BUCKET = defaultdict(list)
RATE_LIMIT_MAX = 150
RATE_LIMIT_WINDOW_SECS = 60

def rate_limit(max_requests=RATE_LIMIT_MAX, window_seconds=RATE_LIMIT_WINDOW_SECS):
    """
    Decorator to rate limit incoming API calls per client IP.
    """
    def decorator(f):
        @wraps(f)
        def wrapped(*args, **kwargs):
            ip = request.headers.get("X-Forwarded-For", request.remote_addr or "127.0.0.1")
            now = time.time()
            
            # Clean old records
            timestamps = [t for t in _RATE_LIMIT_BUCKET[ip] if now - t < window_seconds]
            if len(timestamps) >= max_requests:
                return jsonify({
                    "error": "Rate limit exceeded. Please throttle requests.",
                    "status": 429
                }), 429
            
            timestamps.append(now)
            _RATE_LIMIT_BUCKET[ip] = timestamps
            return f(*args, **kwargs)
        return wrapped
    return decorator

def sanitize_string(val, max_len=120):
    """
    Sanitize text input to prevent injection or invalid query payloads.
    """
    if not isinstance(val, str):
        return ""
    # Strip dangerous characters and clamp length
    cleaned = "".join(ch for ch in val if ch.isalnum() or ch in " -_,.()/'\"?").strip()
    return cleaned[:max_len]

def add_security_headers(response):
    """
    Apply standard OWASP security headers.
    """
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["X-Frame-Options"] = "DENY"
    response.headers["X-XSS-Protection"] = "1; mode=block"
    response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
    response.headers["Content-Security-Policy"] = "default-src 'self' 'unsafe-inline' 'unsafe-eval' https: data:; font-src 'self' https: data:; img-src 'self' https: data:;"
    return response
