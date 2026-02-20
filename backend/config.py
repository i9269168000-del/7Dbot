from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    bot_token: str = ""
    admin_chat_id: int = 0
    webapp_url: str = "http://localhost:5173"
    api_url: str = "http://localhost:8000"
    database_url: str = "sqlite:///./7eleven.db"
    admin_secret: str = "change_me_in_production"

    class Config:
        env_file = "../.env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
