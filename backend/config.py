"""EcomGuard Backend Configuration."""

import os
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

load_dotenv()


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # LLM Provider — switch with LLM_PROVIDER=groq|gemini in .env.
    # Groq + GPT-OSS-120B is the spec default; Gemini is a drop-in fallback.
    groq_api_key: str = ""
    gemini_api_key: str | None = None
    llm_provider: str = "groq"
    # Optional explicit override. Leave blank to use the provider's default
    # model below (prevents a stale MODEL_NAME sending, e.g., a Groq model
    # name to Gemini when you flip the provider).
    model_name: str = ""
    groq_model: str = "openai/gpt-oss-120b"
    gemini_model: str = "gemini-2.0-flash"
    groq_base_url: str = "https://api.groq.com/openai/v1"
    gemini_base_url: str = "https://generativelanguage.googleapis.com/v1beta/openai/"

    @property
    def active_provider(self) -> str:
        return (self.llm_provider or "groq").strip().lower()

    @property
    def active_model(self) -> str:
        if self.model_name.strip():
            return self.model_name.strip()
        return self.gemini_model if self.active_provider == "gemini" else self.groq_model

    # Server
    port: int = 8000
    host: str = "0.0.0.0"

    # Business Constraints (embedded in agent context, not hardcoded logic)
    business_name: str = "TechMart PK"
    business_type: str = "Electronics Accessories E-commerce"
    currency: str = "PKR"
    crisis_budget_pkr: int = 50000
    max_daily_customer_notifications: int = 500
    supplier_contact_cooldown_hours: int = 48
    max_refund_per_unit_pkr: int = 1499
    batch_under_investigation: str = "B2024-11"
    product_sku: str = "CBL-047"

    class Config:
        env_file = ".env"


settings = Settings()
