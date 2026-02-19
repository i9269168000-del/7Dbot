from contextlib import asynccontextmanager
from pathlib import Path

from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.openapi.utils import get_openapi
from fastapi.staticfiles import StaticFiles
from sqlalchemy.orm import Session

import crud
import schemas
from config import settings

print(f"!!! LOADED ADMIN_SECRET: '{settings.admin_secret}' (len={len(settings.admin_secret)}) !!!")

from database import Base, engine, get_db
from routers import admin, orders, products


@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(
    title="SevenHelper Delivery API",
    description="Backend для Telegram Mini App доставки товаров 7-Eleven",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(products.router)
app.include_router(orders.router)
app.include_router(admin.router)

from fastapi.responses import FileResponse

# ... (imports)

# Админ-панель — статические файлы
_admin_panel_dir = Path(__file__).parent / "admin-panel"
_admin_panel_dir.mkdir(exist_ok=True)
app.mount("/admin-panel", StaticFiles(directory=str(_admin_panel_dir), html=True), name="admin-panel")


# Фронтенд (SPA) — статические файлы
_frontend_dir = Path(__file__).parent.parent / "frontend" / "dist"

# Служим ассеты (js, css, images)
if (_frontend_dir / "assets").exists():
    app.mount("/assets", StaticFiles(directory=str(_frontend_dir / "assets")), name="assets")

@app.get("/", tags=["frontend"])
async def serve_spa_root():
    if (_frontend_dir / "index.html").exists():
        return FileResponse(_frontend_dir / "index.html")
    return {"message": "Frontend not built. Run 'npm run build' in frontend directory."}

# Catch-all для SPA роутинга (все остальные пути возвращают index.html)
# Важно: это должно быть ПОСЛЕ всех остальных роутов
@app.exception_handler(404)
async def custom_404_handler(request, __):
    if request.url.path.startswith("/api") or request.url.path.startswith("/admin-panel"):
        return {"detail": "Not Found"}
    
    if (_frontend_dir / "index.html").exists():
        return FileResponse(_frontend_dir / "index.html")
    return {"detail": "Not Found"}


@app.get("/debug/config", tags=["health"], include_in_schema=False)
def debug_config():
    """Временный endpoint для диагностики — показывает первые символы ключей."""
    secret = settings.admin_secret
    return {
        "admin_secret_preview": secret[:4] + "***" if len(secret) > 4 else "***",
        "admin_secret_len": len(secret),
    }


@app.get("/settings/transfer", response_model=schemas.TransferDetailsOut, tags=["settings"])
def get_transfer_settings_public(db: Session = Depends(get_db)):
    """Публичный endpoint — реквизиты для перевода (для отображения в Mini App)."""
    return crud.get_transfer_details(db)


def custom_openapi():
    if app.openapi_schema:
        return app.openapi_schema
    schema = get_openapi(
        title=app.title,
        version=app.version,
        description=app.description,
        routes=app.routes,
    )
    # Добавляем схему безопасности — появится кнопка Authorize в Swagger UI
    schema["components"]["securitySchemes"] = {
        "AdminSecret": {
            "type": "apiKey",
            "in": "header",
            "name": "X-Admin-Secret",
        }
    }
    # Применяем схему ко всем /admin/* маршрутам
    for path, methods in schema.get("paths", {}).items():
        if path.startswith("/admin"):
            for method in methods.values():
                method["security"] = [{"AdminSecret": []}]
    app.openapi_schema = schema
    return schema


app.openapi = custom_openapi

