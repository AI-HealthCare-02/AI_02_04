from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import sentry_sdk
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.sqlalchemy import SqlalchemyIntegration
from app.core.limiter import limiter
from app.core.config import settings
from app.routers import auth, user, health, challenge,character,dashboard, diet, predict, recommend,report


sentry_sdk.init(
    dsn = settings.SENTRY_DSN,
    intergrations =[
        FastApiIntergration(),
        SqlalchemyIntegration()
    ],
    traces_sample_rate= 1.0,
    environment=settings.APP_ENV,
)

app = FastAPI(
    title="당마고치 API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",
        "https://app.dangmagoapp.shop",
        "https://dangmagoapp.shop",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(user.router, prefix="/users", tags=["users"])
app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(challenge.router, prefix="/challenges", tags=["challenges"])
app.include_router(character.router, prefix="/character", tags=["character"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(diet.router, prefix="/diet", tags=["diet"])
app.include_router(predict.router, prefix="/predict", tags=["predict"])
app.include_router(recommend.router, prefix="/recommend", tags=["recommend"])
app.include_router(report.router, prefix="/report", tags=["report"])


app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
