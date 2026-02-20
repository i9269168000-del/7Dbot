from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional

import crud
import schemas
from database import get_db

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/{telegram_id}", response_model=schemas.UserOut)
def get_user(telegram_id: int, db: Session = Depends(get_db)):
    """Получить информацию о пользователе по Telegram ID."""
    user = crud.get_user_by_telegram_id(db, telegram_id)
    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")
    return user

@router.put("/{telegram_id}/display_name", response_model=schemas.UserOut)
def update_display_name(
    telegram_id: int, 
    name: str, 
    db: Session = Depends(get_db)
):
    """Обновить отображаемое имя пользователя."""
    user = crud.update_user_display_name(db, telegram_id, name)
    if not user:
        # Если пользователя ещё нет, создаём его (может быть полезно при первом входе в бота)
        user = crud.get_or_create_user(
            db, 
            schemas.UserCreate(
                telegram_id=telegram_id,
                username="",
                first_name="",
                display_name=name
            )
        )
    return user
