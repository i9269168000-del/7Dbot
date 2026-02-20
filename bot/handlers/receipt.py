import httpx
from aiogram import F, Router
from aiogram.types import (
    CallbackQuery,
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
)

from config import settings

router = Router()

# Фильтр: только личные сообщения с фото (не в группах)
@router.message(F.photo)
async def handle_receipt_photo(message: Message):
    """
    Пользователь отправляет фото чека.
    Бот спрашивает номер заказа, затем пересылает фото админу.
    """
    # Берём file_id самого большого размера фото
    photo = message.photo[-1]
    file_id = photo.file_id

    # Просим пользователя указать номер заказа в подписи
    # Если подпись уже есть — пробуем распарсить order_id
    caption = message.caption or ""
    order_id = None
    for part in caption.split():
        if part.isdigit():
            order_id = int(part)
            break

    if not order_id:
        await message.reply(
            "📎 Получил фото чека!\n\n"
            "Пожалуйста, отправь его ещё раз с подписью, содержащей номер заказа.\n"
            "Например: <code>Чек заказ 42</code>",
            parse_mode="HTML",
        )
        return

    user = message.from_user
    user_info = f"@{user.username}" if user.username else f"ID {user.id}"

    # Сохраняем file_id в бэкенде как receipt_url
    order_details = None
    try:
        async with httpx.AsyncClient() as client:
            # Сначала сохраняем чек
            await client.post(
                f"{settings.api_url}/api/orders/{order_id}/receipt",
                json={"order_id": order_id, "receipt_url": file_id},
                timeout=10,
            )
            # Затем получаем детали заказа для админа
            resp = await client.get(f"{settings.api_url}/api/orders/{order_id}")
            if resp.status_code == 200:
                order_details = resp.json()
    except Exception as e:
        print(f"Error fetching order: {e}")

    user = message.from_user
    display_name = user.full_name
    order_info_text = ""
    
    if order_details:
        display_name = order_details["user"].get("display_name") or user.full_name
        contact_info = order_details.get("contact_info") or "не указан"
        
        items_lines = []
        for it in order_details["items"]:
            opts = []
            if it.get("options") and it["options"].get("heat_up"):
                opts.append("🔥 Разогреть")
            opt_str = f" ({', '.join(opts)})" if opts else ""
            items_lines.append(f"• {it['product']['name_ru'] or it['product']['name']}{opt_str} x {it['quantity']}")
        
        items_text = "\n".join(items_lines)
        order_info_text = (
            f"\n📞 <b>Связь:</b> {contact_info}\n"
            f"💰 <b>Сумма:</b> ฿{order_details['total_thb']}\n"
            f"📦 <b>Состав:</b>\n{items_text}\n"
        )

    # Пересылаем фото в чат администратора
    confirm_kb = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="✅ Подтвердить оплату",
                    callback_data=f"confirm:{order_id}:{user.id}",
                ),
                InlineKeyboardButton(
                    text="❌ Отклонить",
                    callback_data=f"reject:{order_id}:{user.id}",
                ),
            ]
        ]
    )

    await message.bot.send_photo(
        chat_id=settings.admin_chat_id,
        photo=file_id,
        caption=(
            f"🧾 <b>Чек оплаты за заказ #{order_id}</b>\n"
            f"👤 <b>{display_name}</b> (@{user.username or '—'})\n"
            f"{order_info_text}"
            f"\n🆔 Telegram ID: <code>{user.id}</code>"
        ),
        reply_markup=confirm_kb,
        parse_mode="HTML",
    )

    await message.reply(
        f"✅ Чек по заказу <b>#{order_id}</b> отправлен на проверку!\n"
        "Мы уведомим тебя после подтверждения оплаты.",
        parse_mode="HTML",
    )
