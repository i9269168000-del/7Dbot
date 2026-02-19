import httpx
from aiogram import F, Router
from aiogram.types import CallbackQuery

from config import settings

router = Router()


@router.callback_query(F.data.startswith("confirm:"))
async def confirm_payment(callback: CallbackQuery):
    """Админ нажал 'Подтвердить оплату'."""
    _, order_id_str, user_id_str = callback.data.split(":")
    order_id = int(order_id_str)
    user_id = int(user_id_str)

    # Обновляем статус в бэкенде
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                f"{settings.api_url}/admin/orders/{order_id}/confirm",
                headers={"X-Admin-Secret": settings.admin_secret},
                timeout=10,
            )
        if resp.status_code != 200:
            await callback.answer("⚠️ Ошибка при обновлении статуса", show_alert=True)
            return
    except Exception as e:
        await callback.answer(f"⚠️ Ошибка: {e}", show_alert=True)
        return

    # Уведомляем пользователя
    await callback.bot.send_message(
        chat_id=user_id,
        text=(
            f"✅ <b>Оплата подтверждена!</b>\n\n"
            f"📦 Заказ <b>#{order_id}</b> принят в работу.\n"
            "Мы сообщим, когда курьер выедет."
        ),
        parse_mode="HTML",
    )

    # Обновляем сообщение у админа
    await callback.message.edit_caption(
        caption=callback.message.caption + "\n\n✅ <b>ОПЛАТА ПОДТВЕРЖДЕНА</b>",
        parse_mode="HTML",
        reply_markup=None,
    )
    await callback.answer("Оплата подтверждена!")


@router.callback_query(F.data.startswith("reject:"))
async def reject_payment(callback: CallbackQuery):
    """Админ нажал 'Отклонить'."""
    _, order_id_str, user_id_str = callback.data.split(":")
    order_id = int(order_id_str)
    user_id = int(user_id_str)

    # Уведомляем пользователя
    await callback.bot.send_message(
        chat_id=user_id,
        text=(
            f"❌ <b>Оплата отклонена</b>\n\n"
            f"📦 Заказ <b>#{order_id}</b>\n"
            "Пожалуйста, свяжись с поддержкой или отправь чек повторно."
        ),
        parse_mode="HTML",
    )

    # Обновляем сообщение у админа
    await callback.message.edit_caption(
        caption=callback.message.caption + "\n\n❌ <b>ОТКЛОНЕНО</b>",
        parse_mode="HTML",
        reply_markup=None,
    )
    await callback.answer("Отклонено.")


@router.callback_query(F.data.startswith("status:"))
async def update_status(callback: CallbackQuery):
    """Обновить статус заказа (delivering / done)."""
    _, order_id_str, user_id_str, new_status = callback.data.split(":")
    order_id = int(order_id_str)
    user_id = int(user_id_str)

    status_labels = {
        "delivering": "🚴 В пути",
        "done": "✅ Доставлен",
    }

    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                f"{settings.api_url}/admin/orders/{order_id}/status",
                json={"status": new_status},
                headers={"X-Admin-Secret": settings.admin_secret},
                timeout=10,
            )
    except Exception as e:
        await callback.answer(f"⚠️ Ошибка: {e}", show_alert=True)
        return

    label = status_labels.get(new_status, new_status)
    await callback.bot.send_message(
        chat_id=user_id,
        text=f"📦 Статус заказа <b>#{order_id}</b> обновлён: <b>{label}</b>",
        parse_mode="HTML",
    )
    await callback.answer(f"Статус: {label}")
