from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel, Field


# ─── Product ────────────────────────────────────────────────────────────────

class ProductCreate(BaseModel):
    name: str
    name_ru: str
    category: str
    price_thb: float = Field(gt=0, description="Закупочная цена в THB")
    image_url: Optional[str] = None
    is_available: int = 1


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    name_ru: Optional[str] = None
    category: Optional[str] = None
    price_thb: Optional[float] = None
    image_url: Optional[str] = None
    is_available: Optional[int] = None


class ProductOut(BaseModel):
    id: int
    name: str
    name_ru: str
    category: str
    price_thb: float
    sell_price_thb: float
    image_url: Optional[str]
    is_available: int

    class Config:
        from_attributes = True


# ─── User ────────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: Optional[str]
    first_name: Optional[str]

    class Config:
        from_attributes = True


# ─── Order ───────────────────────────────────────────────────────────────────

class OrderItemCreate(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class OrderCreate(BaseModel):
    telegram_id: int
    username: Optional[str] = None
    first_name: Optional[str] = None
    address: str
    maps_url: Optional[str] = None
    payment_method: str = Field(pattern="^(transfer|crypto)$")
    items: List[OrderItemCreate]


class OrderItemOut(BaseModel):
    id: int
    product_id: int
    quantity: int
    price_thb: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True


class OrderOut(BaseModel):
    id: int
    user_id: int
    address: str
    maps_url: Optional[str]
    payment_method: str
    status: str
    total_thb: float
    receipt_url: Optional[str]
    created_at: datetime
    items: List[OrderItemOut]

    class Config:
        from_attributes = True


class OrderStatusUpdate(BaseModel):
    status: str = Field(pattern="^(new|paid|delivering|done)$")


class ReceiptUpload(BaseModel):
    receipt_url: str
    order_id: int


# ─── Admin ───────────────────────────────────────────────────────────────────

class AdminAuth(BaseModel):
    secret: str


# ─── App Settings ─────────────────────────────────────────────────────────────

class AppSettingsUpdate(BaseModel):
    """Обновление одной настройки по ключу."""
    value: Optional[str] = None


class AppSettingsOut(BaseModel):
    key: str
    value: Optional[str]

    class Config:
        from_attributes = True


class TransferDetailsOut(BaseModel):
    """Реквизиты для перевода на карту РФ."""
    phone: Optional[str] = None       # номер телефона для СБП
    bank: Optional[str] = None        # название банка
    qr_image_url: Optional[str] = None  # ссылка на QR-код
