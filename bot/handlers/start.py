import httpx
from aiogram import F, Router
from aiogram.filters import CommandStart
from aiogram.fsm.context import FSMContext
from aiogram.fsm.state import State, StatesGroup
from aiogram.types import (
    InlineKeyboardButton,
    InlineKeyboardMarkup,
    Message,
    WebAppInfo,
)

from config import settings

router = Router()

class Onboarding(StatesGroup):
    waiting_for_name = State()


def get_start_keyboard():
    return InlineKeyboardMarkup(
        inline_keyboard=[
            [
                InlineKeyboardButton(
                    text="🛒 Открыть магазин",
                    web_app=WebAppInfo(url=settings.webapp_url),
                )
            ]
        ]
    )


@router.message(CommandStart())
async def cmd_start(message: Message, state: FSMContext):
    """Приветствие и проверка онбординга."""
    # Проверяем наличие имени в БД
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(f"{settings.api_url}/api/users/{message.from_user.id}")
            if resp.status_code == 200:
                user_data = resp.json()
                if user_data.get("display_name"):
                    await message.answer(
                        f"👋 С возвращением, <b>{user_data['display_name']}</b>!\n\n"
                        "Рады видеть тебя снова. Нажми кнопку ниже, чтобы перейти к покупкам.",
                        reply_markup=get_start_keyboard(),
                        parse_mode="HTML"
                    )
                    return
        except Exception as e:
            pass # Если API недоступно, продолжаем как обычно или логируем

    await message.answer(
        "👋 Добро пожаловать в <b>SevenHelper</b>!\n\n"
        "Прежде чем начать, пожалуйста, <b>введи своё имя</b> (как к тебе обращаться?).",
        parse_mode="HTML"
    )
    await state.set_state(Onboarding.waiting_for_name)


@router.message(Onboarding.waiting_for_name)
async def process_name(message: Message, state: FSMContext):
    """Сохранение имени и завершение онбординга."""
    name = message.text.strip()
    if not name or len(name) < 2:
        await message.answer("Пожалуйста, введи корректное имя.")
        return

    # Сохраняем имя в БД
    async with httpx.AsyncClient() as client:
        try:
            await client.put(
                f"{settings.api_url}/api/users/{message.from_user.id}/display_name",
                params={"name": name}
            )
        except Exception as e:
            await message.answer("⚠️ Ошибка сохранения имени, но ты можешь продолжить.")

    await state.clear()
    await message.answer(
        f"Приятно познакомиться, <b>{name}</b>! ✨\n\n"
        "Теперь ты можешь открыть каталог и оформить свой первый заказ.",
        reply_markup=get_start_keyboard(),
        parse_mode="HTML"
    )
