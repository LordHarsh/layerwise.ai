"""Vercel serverless function entry point."""

from api.main import app

# Vercel expects the ASGI app to be named 'app' or 'handler'
handler = app
