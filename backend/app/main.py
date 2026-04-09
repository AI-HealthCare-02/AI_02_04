from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers import auth, user, health, challenge,character,dashboard, diet, predict, recommend


app = FastAPI(
    title="당마고치 API",
    version="1.0.0",
    docs_url="/docs" if settings.APP_ENV != "production" else None,
    redoc_url="/redoc" if settings.APP_ENV != "production" else None,
)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
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


@app.get("/health")
def health_check():
    return {"status": "ok", "env": settings.APP_ENV}
