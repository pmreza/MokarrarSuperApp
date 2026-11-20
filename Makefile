# ==============================================================================
# MOKARRAR UNIFIED ENTERPRISE SUPER APP - MAKEFILE
# ==============================================================================

.PHONY: help init up-phase1 up-all down logs restart test lint

help:
	@echo "دستورات راه‌اندازی سامانه یکپارچه مکرر (Mokarrar):"
	@echo "  make init        - مقداردهی اولیه فایل تنظیمات و پوشه‌ها"
	@echo "  make up-phase1   - اجرای فاز ۱ (هسته مرکزی + پایگاه داده + فرانت‌اند با حالت Mock)"
	@echo "  make up-all      - اجرای تمام سرویس‌ها (Core + Plane + InvenTree + n8n)"
	@echo "  make down        - متوقف‌سازی و خروج از تمام کانتینرها"
	@echo "  make logs        - نمایش لاگ‌های زنده سیستم"
	@echo "  make test        - اجرای تست‌های سرور و کلاینت"

init:
	@if [ ! -f .env ]; then cp .env.example .env && echo "[OK] Created .env from .env.example"; else echo "[INFO] .env already exists"; fi
	@mkdir -p services/n8n/workflows
	@echo "[OK] Initialized directory structure for Mokarrar."

up-phase1:
	@echo "[START] Starting Phase 1 (Mokarrar Gateway, DB, and RTL Frontend)..."
	docker compose up -d mokarrar-db mokarrar-backend mokarrar-frontend
	@echo "[DONE] Phase 1 ready! Frontend: http://localhost:3000 | Backend: http://localhost:8000/docs"

up-all:
	@echo "[START] Starting all enterprise services (Mokarrar Core, Plane, InvenTree, n8n)..."
	docker compose --profile all up -d
	@echo "[DONE] All services started!"
	@echo "       Mokarrar Frontend: http://localhost:3000"
	@echo "       Mokarrar Backend:  http://localhost:8000/docs"
	@echo "       Plane Admin:       http://localhost:8091"
	@echo "       InvenTree Admin:   http://localhost:8092"
	@echo "       n8n Workflow:      http://localhost:5678"

down:
	@echo "[STOP] Stopping all Mokarrar containers..."
	docker compose --profile all down

logs:
	docker compose logs -f
