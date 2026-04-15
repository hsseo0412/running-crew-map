from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.crews import router as crews_router
from app.api.reviews import router as reviews_router
from app.core.config import settings

app = FastAPI(title=settings.app_name, debug=settings.debug)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(crews_router)
app.include_router(reviews_router)


@app.get("/health")
def health_check():
    return {"status": "ok", "app": settings.app_name}
