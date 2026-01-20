"""Vercel serverless function entry point."""

from py_api._main import app

# Vercel expects the ASGI app to be named 'app' or 'handler'
handler = app
