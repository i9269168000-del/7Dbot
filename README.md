# 7-Eleven Delivery — Telegram Mini App

MVP приложения для доставки товаров 7-Eleven по Таиланду.

## Стек

| Часть | Технологии |
|---|---|
| Backend | FastAPI, SQLite, SQLAlchemy |
| Bot | aiogram 3 |
| Frontend | React 18 + Vite |

---

## Структура проекта

```
faranga/
├── backend/      # FastAPI API
├── bot/          # aiogram 3 бот
├── frontend/     # React + Vite Mini App
├── .env.example  # шаблон переменных окружения
└── requirements.txt
```

---

## Шаг 1 — Создай файл `.env`

Скопируй `.env.example` в `.env` и заполни:

```bash
cp .env.example .env
```

```env
BOT_TOKEN=1234567890:AABBCCDDEEFFaabbccddeeff  # токен от @BotFather
ADMIN_CHAT_ID=123456789                          # твой Telegram ID (узнай у @userinfobot)
WEBAPP_URL=http://localhost:5173                 # URL фронтенда (после деплоя — реальный URL)
API_URL=http://localhost:8000                    # URL бэкенда
ADMIN_SECRET=my_secret_key                       # придумай секретный ключ
```

---

## Шаг 2 — Запуск Backend

```bash
cd backend
pip install -r ../requirements.txt
uvicorn main:app --reload --port 8000
```

Открой **http://localhost:8000/docs** — Swagger UI.

### Добавление товаров вручную

В Swagger UI нажми `POST /admin/products`, кнопку **Try it out** и введи:

```json
{
  "name": "Onigiri Tuna",
  "name_ru": "Онигири с тунцом",
  "category": "food",
  "price_thb": 35,
  "image_url": "https://example.com/onigiri.jpg",
  "is_available": 1
}
```

> **Заголовок:** `X-Admin-Secret: my_secret_key` (твой ADMIN_SECRET из .env)

Цена продажи (+30%) считается автоматически.

**Категории:** `food`, `drinks`, `snacks`, `bakery`, `dairy`, `frozen`, `household`

---

## Шаг 3 — Запуск Bot

```bash
cd bot
python main.py
```

Отправь `/start` боту в Telegram — появится кнопка «Открыть магазин».

---

## Шаг 4 — Запуск Frontend

```bash
cd frontend
npm install
npm run dev
```

Открой **http://localhost:5173** в браузере.

---

## Шаг 5 — Деплой (продакшен)

### Backend
Разверни на любом VPS / [Railway](https://railway.app) / [Render](https://render.com):
```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

### Frontend
```bash
cd frontend
npm run build
```
Загрузи папку `dist/` на [Vercel](https://vercel.com) / [Netlify](https://netlify.com).

### После деплоя
1. Обнови `WEBAPP_URL` в `.env` на реальный URL фронтенда
2. Перезапусти бота
3. Зарегистрируй Mini App у @BotFather: `/newapp` → укажи URL фронтенда

---

## Флоу работы

```
Пользователь                Bot                   Backend
    │                        │                        │
    ├─ /start ──────────────►│                        │
    │◄─ кнопка WebApp ───────┤                        │
    │                        │                        │
    ├─ открывает Mini App ───────────────────────────►│
    │◄─ каталог товаров ─────────────────────────────┤
    │                        │                        │
    ├─ оформляет заказ ──────────────────────────────►│
    │◄─ order_id ────────────────────────────────────┤
    │                        │                        │
    ├─ фото чека ────────────►│                        │
    │                        ├─ пересылает админу     │
    │                        │                        │
    │                   Админ нажимает ✅              │
    │                        ├─ POST /admin/confirm ──►│
    │◄─ уведомление ─────────┤                        │
```

---

## Статусы заказа

| Статус | Описание |
|---|---|
| `new` | Заказ создан, ожидает оплаты |
| `paid` | Оплата подтверждена |
| `delivering` | Курьер в пути |
| `done` | Доставлен |
