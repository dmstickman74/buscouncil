import hashlib
import hmac
import os
import time

from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

from api.config import CSRF_SECRET

import logging

logger = logging.getLogger("council.middleware")


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.url.path in ("/health", "/api/health"):
            return await call_next(request)

        start = time.perf_counter()
        response = await call_next(request)
        elapsed = (time.perf_counter() - start) * 1000

        logger.info(
            "%s %s %s %.0fms",
            request.method,
            request.url.path,
            response.status_code,
            elapsed,
        )
        return response


SAFE_METHODS = {"GET", "HEAD", "OPTIONS"}
CSRF_COOKIE = "council_csrf"


class CSRFMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        if request.method in SAFE_METHODS:
            response = await call_next(request)
            if CSRF_COOKIE not in request.cookies:
                token = os.urandom(32).hex()
                sig = hmac.new(CSRF_SECRET.encode(), token.encode(), hashlib.sha256).hexdigest()
                cookie_val = f"{token}:{sig}"
                response.set_cookie(
                    CSRF_COOKIE,
                    cookie_val,
                    httponly=False,
                    samesite="strict",
                    secure=request.url.scheme == "https",
                    path="/",
                )
            return response

        cookie = request.cookies.get(CSRF_COOKIE)
        if not cookie or ":" not in cookie:
            return Response(
                '{"detail":"CSRF cookie missing"}',
                status_code=403,
                media_type="application/json",
            )

        token, sig = cookie.split(":", 1)
        expected_sig = hmac.new(CSRF_SECRET.encode(), token.encode(), hashlib.sha256).hexdigest()
        if not hmac.compare_digest(sig, expected_sig):
            return Response(
                '{"detail":"CSRF cookie invalid"}',
                status_code=403,
                media_type="application/json",
            )

        header = request.headers.get("X-CSRF-Token", "")
        if not hmac.compare_digest(header, token):
            return Response(
                '{"detail":"CSRF token mismatch"}',
                status_code=403,
                media_type="application/json",
            )

        return await call_next(request)
