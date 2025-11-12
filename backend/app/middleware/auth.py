from fastapi import Request, status
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timezone
from typing import Optional

from app.db.session import SessionLocal
from app.db.models.account import AuthSession, AuthUser
from app.db.models.user_preferences import UserPreference

PUBLIC_ROUTES = {
    "/docs",
    "/redoc",
    "/openapi.json",
    "/health",
    "/api/v1/webhooks/github",
    "/api/v1/webhooks/github/installation",
    "/api/v1/auth/signin",
    "/api/v1/auth/signup",
    "/api/v1/auth/callback",
}


class BetterAuthMiddleware(BaseHTTPMiddleware):
    """
    Authentication middleware for Better Auth session validation.

    Extracts session tokens from Authorization header, X-Session-Token header,
    or cookies and validates them against the database. Protects all routes
    except those listed in PUBLIC_ROUTES.
    """
    def _extract_from_headers(self, request: Request) -> Optional[str]:
        # Check Authorization header first
        auth_header = request.headers.get("Authorization")
        if auth_header and auth_header.startswith("Bearer "):
            return auth_header.split(" ")[1]
        
        # Check X-Session-Token header
        session_token = request.headers.get("X-Session-Token")
        if session_token:
            return session_token
            
        # Check cookies for better-auth session token
        cookies = request.cookies
        if "better-auth.session_token" in cookies:
            return cookies["better-auth.session_token"]
            
        return None

    def verify_session(self, session_token: str) -> Optional[dict]:
        db: Session = SessionLocal()
        try:
            result = (
                db.query(AuthSession, UserPreference)
                .join(AuthUser, AuthSession.userId == AuthUser.id)
                .outerjoin(UserPreference, AuthSession.userId == UserPreference.user_id)
                .filter(AuthSession.token == session_token)
                .first()
            )

            if not result:
                return None

            auth_session, user_preferences = result

            if not auth_session:
                return None

            if (
                hasattr(auth_session, "expires_at")
                and auth_session.expires_at < datetime.now(timezone.utc)
            ):
                return None

            user = {
                "id": auth_session.user.id,
                "email": auth_session.user.email,
                "name": getattr(auth_session.user, "name", None),
                "token": session_token,
                "organization_id": getattr(user_preferences, "organization_id", None),
            }

            return user
        finally:
            db.close()

    async def dispatch(self, request: Request, call_next):
        if request.method == "OPTIONS" or request.url.path.rstrip("/") in PUBLIC_ROUTES:
            return await call_next(request)

        session_token = self._extract_from_headers(request)
        if not session_token:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Authentication required"},
            )

        user_data = self.verify_session(session_token)
        if not user_data:
            return JSONResponse(
                status_code=status.HTTP_401_UNAUTHORIZED,
                content={"detail": "Invalid or expired session"},
            )

        request.state.user = user_data
        request.state.user_id = user_data["id"]

        return await call_next(request)
