import logging

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException
from sqlalchemy.orm import Session

import crud
import models
import schemas
from config import settings
from database import get_db

router = APIRouter(prefix="/orders", tags=["orders"])

logger = logging.getLogger(__name__)

PAYMENT_LABELS = {
    "transfer": "Перевод на карту РФ",
    "crypto": "Оплата криптовалютой",
}

STATUS_LABELS = {
    "new": "Ожидает оплаты",
    "paid": "Оплачен",
    "delivering": "В пути",
    "done": "Выполнен",
    "cancelled": "Отменён",
}


def send_order_notification(order: schemas.OrderOut, telegram_id: int) -> None:
    """
    Отправляет пользователю в Telegram список товаров после создания заказа.
    Запускается в фоне через BackgroundTasks.
    """
    if not settings.bot_token or not telegram_id:
        return

    lines = []
    for item in order.items:
        name = item.product.name_ru or item.product.name
        # Обработка опций (например, "Разогреть")
        options_text = ""
        if item.options:
            opts = []
            if item.options.get("heat_up"):
                opts.append("🔥 Разогреть")
            if opts:
                options_text = f" ({', '.join(opts)})"
        
        subtotal = item.price_thb * item.quantity
        lines.append(f"  • {name}{options_text} × {item.quantity} — ฿{subtotal:.0f}")

    items_text = "\n".join(lines)
    payment_label = PAYMENT_LABELS.get(order.payment_method, order.payment_method)
    maps_line = (
        f"\n📍 <b>Адрес:</b> {order.address}"
        f"\n🗺 <a href='{order.maps_url}'>Открыть на карте</a>"
        if order.maps_url else f"\n📍 <b>Адрес:</b> {order.address}"
    )
    
    contact_line = (
        f"\n📞 <b>Связь:</b> {order.contact_info}"
        if order.contact_info else ""
    )

    text = (
        f"✅ <b>Заказ #{order.id} оформлен!</b>\n\n"
        f"📦 <b>Состав заказа:</b>\n{items_text}\n\n"
        f"💰 <b>Итого:</b> ฿{order.total_thb:.0f}\n"
        f"💳 <b>Оплата:</b> {payment_label}"
        f"{maps_line}"
        f"{contact_line}\n\n"
        f"📎 Отправь фото чека боту с подписью: <code>#{order.id}</code>"
    )

    try:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
                json={
                    "chat_id": telegram_id,
                    "text": text,
                    "parse_mode": "HTML",
                    "disable_web_page_preview": True,
                },
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить уведомление пользователю: {e}")


@router.post("", response_model=schemas.OrderOut, status_code=201)
def create_order(
    data: schemas.OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    """
    Создать заказ.
    После создания — отправляет пользователю список товаров в Telegram (фоновая задача).
    """
    order = crud.create_order(db, data)
    if order is None:
        raise HTTPException(
            status_code=400,
            detail="Один или несколько товаров недоступны или не найдены",
        )

    order_out = schemas.OrderOut.model_validate(order)

    # Отправляем уведомление в фоне — не блокирует ответ клиенту
    if data.telegram_id:
        background_tasks.add_task(send_order_notification, order_out, data.telegram_id)

    return order_out


def send_status_notification(order: models.Order) -> None:
    """
    Отправляет уведомление пользователю о смене статуса заказа.
    """
    if not settings.bot_token or not order.user.telegram_id:
        return

    status_label = STATUS_LABELS.get(order.status, order.status)
    
    text = (
        f"🔔 <b>Статус заказа #{order.id} изменён!</b>\n\n"
        f"Новый статус: <b>{status_label}</b>"
    )

    try:
        with httpx.Client(timeout=10) as client:
            client.post(
                f"https://api.telegram.org/bot{settings.bot_token}/sendMessage",
                json={
                    "chat_id": order.user.telegram_id,
                    "text": text,
                    "parse_mode": "HTML",
                },
            )
    except Exception as e:
        logger.warning(f"Не удалось отправить уведомление о статусе: {e}")


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: int, db: Session = Depends(get_db)):
    """Получить заказ по ID (для отображения статуса пользователю)."""
    order = crud.get_order(db, order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


@router.post("/{order_id}/receipt", response_model=schemas.OrderOut)
def upload_receipt(
    order_id: int,
    data: schemas.ReceiptUpload,
    db: Session = Depends(get_db),
):
    """Сохранить ссылку на фото чека."""
    if data.order_id != order_id:
        raise HTTPException(status_code=400, detail="order_id не совпадает")
    order = crud.set_receipt_url(db, order_id, data.receipt_url)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order
