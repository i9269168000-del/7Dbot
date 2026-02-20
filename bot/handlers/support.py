from aiogram import F, Router
from aiogram.types import Message
from config import settings

router = Router()

# Метка для поиска ID пользователя в ответе админа
USER_ID_MARKER = "#user_id_"

@router.message(F.chat.type == "private", ~F.text.startswith("/"))
async def forward_to_admin(message: Message):
    """
    Пересылает любое сообщение от пользователя админу.
    Добавляет в конец сообщения скрытую метку с ID пользователя.
    """
    if message.chat.id == settings.admin_chat_id:
        return # Не обрабатываем сообщения от самого админа здесь

    user = message.from_user
    user_info = f"👤 <b>{user.full_name}</b>"
    if user.username:
        user_info += f" (@{user.username})"
    
    label = f"\n\n{USER_ID_MARKER}{user.id}"
    
    # Если это текст
    if message.text:
        await message.bot.send_message(
            chat_id=settings.admin_chat_id,
            text=f"✉️ <b>Новое сообщение:</b>\n\n{message.text}{label}",
            parse_mode="HTML"
        )
    # Если это фото
    elif message.photo:
        caption = message.caption or ""
        await message.bot.send_photo(
            chat_id=settings.admin_chat_id,
            photo=message.photo[-1].file_id,
            caption=f"🖼 <b>Фото от пользователя:</b>\n{caption}{label}",
            parse_mode="HTML"
        )
    else:
        # Для других типов (стикеры, видео и т.д.) просто пересылаем информацию
        await message.bot.send_message(
            chat_id=settings.admin_chat_id,
            text=f"📎 Пользователь прислал медиа-файл (не текст/фото).{label}",
            parse_mode="HTML"
        )

@router.message(F.chat.id == settings.admin_chat_id, F.reply_to_message)
async def reply_from_admin(message: Message):
    """
    Обрабатывает ответ (Reply) админа.
    Парсит ID пользователя из оригинального сообщения и отправляет ответ.
    """
    reply = message.reply_to_message
    text = reply.text or reply.caption or ""
    
    if USER_ID_MARKER not in text:
        return # Это не ответ на сообщение пользователя

    try:
        # Извлекаем ID после маркера
        user_id_str = text.split(USER_ID_MARKER)[-1].strip()
        user_id = int(user_id_str)
        
        # Отправляем ответ пользователю
        if message.text:
            await message.bot.send_message(chat_id=user_id, text=f"💬 <b>Ответ оператора:</b>\n\n{message.text}")
        elif message.photo:
            await message.bot.send_photo(
                chat_id=user_id,
                photo=message.photo[-1].file_id,
                caption=f"💬 <b>Ответ оператора:</b>\n{message.caption or ''}"
            )
        
        await message.reply("✅ Ответ отправлен пользователю.")
    except Exception as e:
        await message.reply(f"❌ Ошибка отправки: {e}")
