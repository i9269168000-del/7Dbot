from aiogram import Router
from aiogram.filters import CommandStart
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from config import settings

router = Router()


@router.message(CommandStart())
async def cmd_start(message: Message):
    """Приветствие и кнопка для открытия Mini App."""
    keyboard = InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🛒 Открыть магазин",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ]
    )
    await message.answer(
        "👋 Добро пожаловать в <b>SevenHelper</b>!\n\n"
        "Доставка товаров 7-Eleven по Таиланду.\n"
        "Нажми кнопку ниже, чтобы открыть каталог и оформить заказ.",
        reply_markup=keyboard,
        parse_mode="HTML",
    )
