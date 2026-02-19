from typing import List, Optional

from fastapi import APIRouter, Depends, Header, HTTPException, Query
from sqlalchemy.orm import Session

import crud
import schemas
from config import settings
from database import get_db

router = APIRouter(prefix="/admin", tags=["admin"])


def verify_admin(
    secret: Optional[str] = Query(None, description="Admin secret key"),
    x_admin_secret: Optional[str] = Header(None),
):
    """Проверка секрета — через query-параметр ?secret=... или заголовок X-Admin-Secret."""
    token = secret or x_admin_secret
    if not token or token != settings.admin_secret:
        raise HTTPException(status_code=403, detail="Доступ запрещён")



# ─── Товары ──────────────────────────────────────────────────────────────────

@router.post(
    "/products",
    response_model=schemas.ProductOut,
    status_code=201,
    dependencies=[Depends(verify_admin)],
)
def create_product(data: schemas.ProductCreate, db: Session = Depends(get_db)):
    """Добавить новый товар. Цена продажи = price_thb * 1.30 (считается автоматически)."""
    return crud.create_product(db, data)


@router.put(
    "/products/{product_id}",
    response_model=schemas.ProductOut,
    dependencies=[Depends(verify_admin)],
)
def update_product(
    product_id: int,
    data: schemas.ProductUpdate,
    db: Session = Depends(get_db),
):
    """Обновить товар. Если изменилась price_thb — sell_price пересчитается."""
    product = crud.update_product(db, product_id, data)
    if not product:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return product


@router.delete(
    "/products/{product_id}",
    dependencies=[Depends(verify_admin)],
)
def delete_product(product_id: int, db: Session = Depends(get_db)):
    """Удалить товар."""
    ok = crud.delete_product(db, product_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Товар не найден")
    return {"detail": "Товар удалён"}


@router.get(
    "/products",
    response_model=List[schemas.ProductOut],
    dependencies=[Depends(verify_admin)],
)
def list_all_products(db: Session = Depends(get_db)):
    """Список всех товаров (включая недоступные)."""
    return crud.get_products(db, available_only=False)


# ─── Заказы ──────────────────────────────────────────────────────────────────

@router.get(
    "/orders",
    response_model=List[schemas.OrderOut],
    dependencies=[Depends(verify_admin)],
)
def list_orders(
    status: Optional[str] = None,
    db: Session = Depends(get_db),
):
    """Список заказов (с фильтром по статусу)."""
    return crud.get_orders(db, status=status)


@router.post(
    "/orders/{order_id}/confirm",
    response_model=schemas.OrderOut,
    dependencies=[Depends(verify_admin)],
)
def confirm_payment(order_id: int, db: Session = Depends(get_db)):
    """Подтвердить оплату — переводит заказ в статус 'paid'."""
    order = crud.update_order_status(db, order_id, "paid")
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


@router.post(
    "/orders/{order_id}/status",
    response_model=schemas.OrderOut,
    dependencies=[Depends(verify_admin)],
)
def update_order_status(
    order_id: int,
    data: schemas.OrderStatusUpdate,
    db: Session = Depends(get_db),
):
    """Обновить статус заказа вручную."""
    order = crud.update_order_status(db, order_id, data.status)
    if not order:
        raise HTTPException(status_code=404, detail="Заказ не найден")
    return order


# ─── Настройки реквизитов перевода ───────────────────────────────────────────

@router.get(
    "/settings/transfer",
    response_model=schemas.TransferDetailsOut,
    dependencies=[Depends(verify_admin)],
)
def get_transfer_settings(db: Session = Depends(get_db)):
    """Получить реквизиты для перевода на карту РФ."""
    return crud.get_transfer_details(db)


@router.put(
    "/settings/transfer",
    response_model=schemas.TransferDetailsOut,
    dependencies=[Depends(verify_admin)],
)
def update_transfer_settings(
    data: schemas.TransferDetailsOut,
    db: Session = Depends(get_db),
):
    """
    Обновить реквизиты для перевода на карту РФ.
    Поля:
    - phone: номер телефона для СБП (например: +7 900 123-45-67)
    - bank: название банка (например: Сбербанк)
    - qr_image_url: ссылка на QR-код (URL изображения)
    """
    if data.phone is not None:
        crud.set_setting(db, "transfer_phone", data.phone)
    if data.bank is not None:
        crud.set_setting(db, "transfer_bank", data.bank)
    if data.qr_image_url is not None:
        crud.set_setting(db, "transfer_qr_url", data.qr_image_url)
    return crud.get_transfer_details(db)
