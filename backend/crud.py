from typing import List, Optional

from sqlalchemy.orm import Session

import models
import schemas


# ─── Products ────────────────────────────────────────────────────────────────

def get_products(
    db: Session,
    category: Optional[str] = None,
    available_only: bool = True,
) -> List[models.Product]:
    q = db.query(models.Product)
    if available_only:
        q = q.filter(models.Product.is_available == 1)
    if category:
        q = q.filter(models.Product.category == category)
    return q.order_by(models.Product.category, models.Product.name).all()


def get_product(db: Session, product_id: int) -> Optional[models.Product]:
    return db.query(models.Product).filter(models.Product.id == product_id).first()


def create_product(db: Session, data: schemas.ProductCreate) -> models.Product:
    sell_price = round(data.price_thb * 1.30, 2)
    product = models.Product(
        name=data.name,
        name_ru=data.name_ru,
        category=data.category,
        price_thb=data.price_thb,
        sell_price_thb=sell_price,
        image_url=data.image_url,
        is_available=data.is_available,
        # New fields
        calories=data.calories,
        proteins=data.proteins,
        fats=data.fats,
        carbs=data.carbs,
        ingredients=data.ingredients,
        is_hot=data.is_hot,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


def update_product(
    db: Session, product_id: int, data: schemas.ProductUpdate
) -> Optional[models.Product]:
    product = get_product(db, product_id)
    if not product:
        return None
    update_data = data.model_dump(exclude_unset=True)
    # Пересчитываем цену продажи если изменилась закупочная
    if "price_thb" in update_data:
        update_data["sell_price_thb"] = round(update_data["price_thb"] * 1.30, 2)
    for field, value in update_data.items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product


def delete_product(db: Session, product_id: int) -> bool:
    product = get_product(db, product_id)
    if not product:
        return False
    db.delete(product)
    db.commit()
    return True


# ─── Users ───────────────────────────────────────────────────────────────────

def get_or_create_user(db: Session, data: schemas.UserCreate) -> models.User:
    user = (
        db.query(models.User)
        .filter(models.User.telegram_id == data.telegram_id)
        .first()
    )
    if not user:
        user = models.User(
            telegram_id=data.telegram_id,
            username=data.username,
            first_name=data.first_name,
            display_name=data.display_name,
        )
        db.add(user)
    else:
        # Update display_name if provided and not set
        if data.display_name and not user.display_name:
            user.display_name = data.display_name
        # Update other fields just in case
        user.username = data.username
        user.first_name = data.first_name

    db.commit()
    db.refresh(user)
    return user


def get_user_by_telegram_id(db: Session, telegram_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.telegram_id == telegram_id).first()


def update_user_display_name(db: Session, telegram_id: int, name: str) -> Optional[models.User]:
    user = get_user_by_telegram_id(db, telegram_id)
    if not user:
        return None
    user.display_name = name
    db.commit()
    db.refresh(user)
    return user


# ─── Orders ──────────────────────────────────────────────────────────────────

def create_order(db: Session, data: schemas.OrderCreate) -> Optional[models.Order]:
    # Получаем или создаём пользователя
    user = get_or_create_user(
        db,
        schemas.UserCreate(
            telegram_id=data.telegram_id,
            username=data.username,
            first_name=data.first_name,
            display_name=data.display_name,
        ),
    )

    # Считаем итог и проверяем товары
    total = 0.0
    items_data = []
    for item in data.items:
        product = get_product(db, item.product_id)
        if not product or not product.is_available:
            return None  # товар не найден или недоступен
        price = product.sell_price_thb
        total += price * item.quantity
        items_data.append((product, item.quantity, price, item.options))

    order = models.Order(
        user_id=user.id,
        address=data.address,
        maps_url=data.maps_url,
        contact_info=data.contact_info,
        payment_method=data.payment_method,
        status="new",
        total_thb=round(total, 2),
    )
    db.add(order)
    db.flush()  # получаем order.id до commit

    for product, quantity, price, options in items_data:
        order_item = models.OrderItem(
            order_id=order.id,
            product_id=product.id,
            quantity=quantity,
            price_thb=price,
            options=options,
        )
        db.add(order_item)

    db.commit()
    db.refresh(order)
    return order


def get_order(db: Session, order_id: int) -> Optional[models.Order]:
    return db.query(models.Order).filter(models.Order.id == order_id).first()


def get_orders(
    db: Session,
    status: Optional[str] = None,
    limit: int = 50,
) -> List[models.Order]:
    q = db.query(models.Order)
    if status:
        q = q.filter(models.Order.status == status)
    return q.order_by(models.Order.created_at.desc()).limit(limit).all()


def update_order_status(
    db: Session, order_id: int, status: str
) -> Optional[models.Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    order.status = status
    db.commit()
    db.refresh(order)
    return order


def set_receipt_url(
    db: Session, order_id: int, receipt_url: str
) -> Optional[models.Order]:
    order = get_order(db, order_id)
    if not order:
        return None
    order.receipt_url = receipt_url
    db.commit()
    db.refresh(order)
    return order


# ─── Reviews ──────────────────────────────────────────────────────────────────

def create_review(db: Session, user_id: int, data: schemas.ReviewCreate) -> models.Review:
    review = models.Review(
        product_id=data.product_id,
        user_id=user_id,
        rating=data.rating,
        text=data.text,
        is_approved=False,  # Moderation required
    )
    db.add(review)
    db.commit()
    db.refresh(review)
    return review


def get_reviews(
    db: Session,
    product_id: Optional[int] = None,
    approved_only: bool = True,
) -> List[models.Review]:
    q = db.query(models.Review)
    if product_id:
        q = q.filter(models.Review.product_id == product_id)
    if approved_only:
        q = q.filter(models.Review.is_approved == True)
    return q.order_by(models.Review.created_at.desc()).all()


def approve_review(db: Session, review_id: int, approved: bool = True) -> Optional[models.Review]:
    review = db.query(models.Review).filter(models.Review.id == review_id).first()
    if not review:
        return None
    review.is_approved = approved
    db.commit()
    db.refresh(review)
    return review


# ─── App Settings ─────────────────────────────────────────────────────────────

TRANSFER_KEYS = ("transfer_phone", "transfer_bank", "transfer_qr_url")


def get_setting(db: Session, key: str) -> Optional[str]:
    row = db.query(models.AppSettings).filter(models.AppSettings.key == key).first()
    return row.value if row else None


def set_setting(db: Session, key: str, value: Optional[str]) -> models.AppSettings:
    row = db.query(models.AppSettings).filter(models.AppSettings.key == key).first()
    if row:
        row.value = value
    else:
        row = models.AppSettings(key=key, value=value)
        db.add(row)
    db.commit()
    db.refresh(row)
    return row


def get_transfer_details(db: Session) -> dict:
    return {
        "phone": get_setting(db, "transfer_phone"),
        "bank": get_setting(db, "transfer_bank"),
        "qr_image_url": get_setting(db, "transfer_qr_url"),
    }
