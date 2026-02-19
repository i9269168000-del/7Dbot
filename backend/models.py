from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)          # название на английском
    name_ru = Column(String(200), nullable=False)       # название на русском
    category = Column(String(100), nullable=False)      # категория
    price_thb = Column(Float, nullable=False)           # цена закупки (THB)
    sell_price_thb = Column(Float, nullable=False)      # цена продажи +30%
    image_url = Column(Text, nullable=True)             # ссылка на фото
    is_available = Column(Integer, default=1)           # 1 = в наличии

    order_items = relationship("OrderItem", back_populates="product")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    telegram_id = Column(Integer, unique=True, nullable=False, index=True)
    username = Column(String(100), nullable=True)
    first_name = Column(String(100), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    orders = relationship("Order", back_populates="user")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    address = Column(Text, nullable=False)
    maps_url = Column(Text, nullable=True)               # ссылка на Google Maps
    payment_method = Column(String(50), nullable=False)  # "transfer" | "crypto"
    status = Column(String(50), default="new")           # new | paid | delivering | done
    total_thb = Column(Float, nullable=False)
    receipt_url = Column(Text, nullable=True)            # ссылка на фото чека
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, nullable=False)
    price_thb = Column(Float, nullable=False)  # цена на момент заказа

    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class AppSettings(Base):
    """Настройки приложения — хранятся в БД, редактируются через админку."""
    __tablename__ = "app_settings"

    key = Column(String(100), primary_key=True)
    value = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
