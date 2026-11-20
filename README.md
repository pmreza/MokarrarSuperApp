# 🏭 سامانه یکپارچه سازمانی و صنعتی «مُکَرَّر» (Mokarrar Enterprise Super App)

<div dir="rtl">

سامانه جامع **«مکرر»** یک سوپراپ سازمانی و صنعتی یکپارچه است که به عنوان درگاه واحد (Single Pane of Glass) برای مدیریت عملیات کارخانه، وظایف نگهداری و تعمیرات، تدارکات خرید چندمرحله‌ای، و انبارداری قطعات طراحی شده است.

این سامانه از ادغام هوشمندانه چهار پروژه متن‌باز پیشرو به صورت Headless و با معماری مدرن **BFF (Backend for Frontend)** پیاده‌سازی شده است.

---

### 🏛️ معماری کلان سامانه (System Architecture)

```
                              ┌─────────────────────────────────────────┐
                              │  کاربران و پرسنل کارخانه (پرسنل / مدیران) │
                              └────────────────────┬────────────────────┘
                                                   │ HTTP (RTL Persian UI)
                                                   ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                        مکرر: هسته درگاه واحد (Mokarrar Core)                            │
│                                                                                        │
│  [mokarrar-frontend] : React 19 + Vite + Tailwind CSS + AppShell یکپارچه (Port 3000)   │
│  [mokarrar-backend]  : FastAPI API Gateway + JWT Auth + RBAC + Adapters (Port 8000)    │
│  [mokarrar-db]       : PostgreSQL 16 (پایگاه داده اصلی + کلیدهای Idempotency)          │
└────────────┬─────────────────────────────┬─────────────────────────────┬───────────────┘
             │                             │                             │
    HTTP / REST (Bridge)          HTTP / REST (Bridge)          Webhooks / HMAC
             │                             │                             │
             ▼                             ▼                             ▼
┌─────────────────────────┐   ┌─────────────────────────┐   ┌─────────────────────────┐
│       موتور فاز ۱        │   │       موتور فاز ۳        │   │    موتور هماهنگ‌ساز      │
│     (Task Engine)       │   │   (Inventory Engine)    │   │  (Workflow Automation)  │
│          Plane          │   │        InvenTree        │   │           n8n           │
│  (مدیریت وظایف و کانبان) │   │  (کاردکس و موجودی انبار)  │   │ (گردش‌کار خودکار فاز ۲و۳)│
│    Port 8091 (Admin)    │   │    Port 8092 (Admin)    │   │    Port 5678 (Admin)    │
└─────────────────────────┘   └─────────────────────────┘   └─────────────────────────┘
```

---

## 🗂️ ساختار مخازن و پوشه‌بندی (Workspace Structure)

سامانه `mokarrar/` به صورت یکپارچه سازمان‌دهی شده است:

```text
mokarrar/
├── docker-compose.yml              # پیکربندی جامع داکر روی شبکه mokarrar-net
├── Makefile                        # دستورات مدیریتی make
├── .env.example                    # نمونه متغیرهای محیطی و سوییچ MOCK_EXTERNAL_SERVICES
├── README.md                       # راهنمای جامع معماری و راه‌اندازی (فارسی و انگلیسی)
│
├── core/                           # هسته درگاه واحد (BFF + Frontend)
│   ├── backend/                    # سرویس FastAPI + آداپتورها + ماژول‌های عملیاتی
│   │   ├── app/
│   │   │   ├── adapters/           # لایه آداپتور ارتباط با سرویس‌های جانبی
│   │   │   │   ├── base.py         # کلاینت انتزاعی HTTP با Retry و مدیریت خطا
│   │   │   │   ├── plane_adapter.py    # ارتباط با تسک‌های Plane + حالت Mock
│   │   │   │   ├── inventree_adapter.py # ارتباط با قطعات و انبارداری InvenTree + حالت Mock
│   │   │   │   └── n8n_adapter.py      # امضای دیجیتال HMAC و شلیک وب‌هوک‌های n8n
│   │   │   ├── modules/
│   │   │   │   ├── tasks/          # پروکسی و غنی‌سازی تسک‌های Plane
│   │   │   │   ├── procurement/    # درخواست‌های خرید و مجوزهای مالی (Phase 2)
│   │   │   │   ├── inventory/      # پروکسی قطعات و کاردکس انبارداری (Phase 3)
│   │   │   │   ├── webhooks/       # دریافت وب‌هوک Plane با تضمین Idempotency Key
│   │   │   │   ├── exports/        # موتور صدور اکسل (RTL) و ورد با استایل شرکتی
│   │   │   │   └── dashboard/      # شاخص‌های کلیدی عملکرد (KPIs)
│   │   │   ├── core/
│   │   │   │   ├── security.py     # احراز هویت یکپارچه JWT + کنترل دسترسی بر اساس نقش (RBAC)
│   │   │   │   └── config.py       # تنظیمات مرکزی
│   └── frontend/                   # فرانت‌اند React 19 با فونت وزیرمتن و طراحی ۱۰۰٪ راست‌چین
│       └── src/
│           ├── layouts/            # معماری تک‌نمای AppShell (قانون اکید عدم تکرار هدر/سایدبار)
│           │   ├── AppShell.tsx    # لایوت سراسری شامل سایدبار، هدر و Outlet
│           │   ├── Header.tsx      # هدر پویا متصل به روت و منوی کاربری
│           │   └── Sidebar.tsx     # سایدبار کانفیگ‌محور بر اساس نقش کاربر
│           ├── config/
│           │   └── navigation.config.ts # تنظیمات متمرکز منوهای ناوبری
│           ├── components/ui/      # کامپوننت‌های اشتراکی (DataTable با خروجی زنده اکسل/ورد)
│           ├── features/           # ماژول‌های موضوعی (Dashboard, Tasks, Procurement, Inventory, Reports)
│           └── services/api.ts     # کلاینت واحد Axios جهت ارتباط با Gateway
│
└── services/                       # سرویس‌های زیرساختی متصل
    ├── plane/                      # مخزن موتور مدیریت وظایف Plane
    ├── inventree/                  # مخزن موتور انبارداری InvenTree
    └── n8n/                        # اتوماسیون گردش کار و فایل‌های JSON
        └── workflows/
            └── purchase_to_inventory.json # ورک‌فلو خودکار از پرداخت خرید تا ورود به انبار
```

---

## 🚀 راهنمای راه‌اندازی سریع فاز ۱ (Quickstart Phase 1)

برای اجرای فاز ۱ نیاز به تنظیم هیچ توکن خارجی نیست؛ به لطف فلگ `MOCK_EXTERNAL_SERVICES=true`، تمامی داده‌های واقعی خطوط تولید کارخانه به شکل شبیه‌سازی‌شده در دسترس هستند.

### ۱. مقداردهی اولیه
```bash
cd mokarrar
make init
```
این دستور فایل `.env` را از روی `.env.example` می‌سازد و پوشه‌های مورد نیاز را بررسی می‌کند.

### ۲. اجرای سرویس‌های فاز ۱ با داکر
```bash
make up-phase1
```
سرویس‌های زیر در دسترس قرار می‌گیرند:
- **رابط کاربری مکرر (فرانت‌اند):** [http://localhost:3000](http://localhost:3000)
- **مستندات گیت‌وی (Swagger API):** [http://localhost:8000/docs](http://localhost:8000/docs)
- **کاربر پیش‌فرض ادمین:** `admin@mokarrar.ir` | کلمه عبور: `Admin123456!`

### ۳. بررسی وضعیت لاگ‌ها
```bash
make logs
```

---

## 🔄 انتقال از فاز ۱ به فاز ۲ و ۳ (Transition to Production Real APIs)

هنگامی که سرورهای Plane و InvenTree آماده بهره‌برداری کامل شدند:

### گام ۱: اتصال کلیدهای API در فایل `.env`
مقدار `MOCK_EXTERNAL_SERVICES` را برابر `false` قرار دهید و کلیدهای دریافتی را وارد کنید:
```env
MOCK_EXTERNAL_SERVICES=false

# اطلاعات اتصال به موتور Plane (فاز ۱)
PLANE_API_URL=http://plane-api:8000
PLANE_API_KEY=pln_live_your_actual_token_here
PLANE_WORKSPACE_SLUG=mokarrar-corp
PLANE_PROJECT_ID=00000000-0000-0000-0000-000000000000

# اطلاعات اتصال به موتور InvenTree (فاز ۳)
INVENTREE_API_URL=http://inventree-server:8000
INVENTREE_API_TOKEN=inv_token_your_actual_token_here

# تنظیمات هماهنگ‌ساز n8n (فاز ۲ و ۳)
N8N_WEBHOOK_URL=http://n8n:5678
N8N_WEBHOOK_SECRET=mokarrar_hmac_secret_2026
```

### گام ۲: اجرای تمامی کانتینرها
```bash
make up-all
```
با این دستور، کانتینرهای Plane، InvenTree و n8n نیز فعال می‌شوند:
- پنل ادمین مخفی Plane: `http://localhost:8091`
- پنل ادمین مخفی InvenTree: `http://localhost:8092`
- کنسول اتوماسیون n8n: `http://localhost:5678`

### گام ۳: ایمپورت گردش‌کار در n8n
1. وارد کنسول n8n در `http://localhost:5678` شوید.
2. گزینه **Workflows -> Import from File** را بزنید.
3. فایل زیر را انتخاب کنید:
   `services/n8n/workflows/purchase_to_inventory.json`
4. ورک‌فلو را در حالت **Active** قرار دهید.

---

## 🔒 امنیت، سطوح دسترسی (RBAC) و کلیدهای Idempotency

### ماتریس دسترسی نقش‌ها (Role-Based Access Control)
| نقش کاربری | داشبورد | تخته کانبان تسک‌ها | درخواست خرید | تایید/رد خرید | ورود و خروج انبار | صدور گزارشات |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **admin (مدیر ارشد)** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| **manager (مدیر بخش)** | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ |
| **warehouse (انباردار)** | ✅ | ✅ | ❌ | ❌ | ✅ | ✅ |
| **staff (پرسنل)** | ✅ | ✅ | ✅ | ❌ | ❌ | ✅ |

### تضمین عدم ورود تکراری کالا (Idempotency Guarantee)
در ماژول وب‌هوک `mokarrar/core/backend/app/modules/webhooks/routes.py`:
- با اتمام تسک در Plane (`state == Done`)، کلید یکتای `plane_issue_done_{task_id}` در جدول `idempotency_keys` ثبت می‌شود.
- در صورتی که رویداد وب‌هوک به دلیل خطای شبکه یا ارسال مجدد چندین بار شلیک شود، سیستم وضعیت قبلی را تشخیص داده و مانع از ثبت مجدد ورود کالا یا ایجاد رسید تکراری در انبار خواهد شد.

---

## 🚀 نقشه راه توسعه و قابلیت‌های افزوده در شاخه `newfutures` (۱۰ گام عملیاتی از دیدگاه کارفرما)

برای تطبیق هرچه بیشتر سامانه با نیازهای واقعی کف کارخانه و پرسنل میدانی:

1. [x] **گام ۱ - اتصال به پیام‌رسان بله (Bale Bot)**: ویژه کارگران خط تولید، اپراتورها و رانندگان بدون نیاز به ورود به داشبورد وب پیچیده. امکان مشاهده تسک‌ها، اعلام پایان کار، استعلام موجودی انبار و ثبت توقف خط با دکمه‌های شیشه‌ای تعاملی.
2. [x] **گام ۲ - اسکنر بارکد و QR انبارداری (Mobile Web Scanner)**: اندپوینت سریع استعلام بارکد `/api/v1/inventory/scan/{code}` و مودال جستجوی بارکد همراه با نمایش عکس، موجودی و هشدار کسری.
3. [x] **گام ۳ - ماژول توقف اضطراری خط و نگهداری تعمیرات (PM)**: ثبت ۱ کلیکی توقف خط با اولویت بحرانی، اعزام فوری تکنسین کشیک، ارسال پیامک و محاسبه شاخص‌های MTTR و Downtime.
4. [x] **گام ۴ - گزارشات شیفت و کنترل ضایعات (Shift & Scrap Tracker)**: ثبت کارکرد شیفت‌های سه‌گانه، مقایسه تارگت تولید با خروجی واقعی، و محاسبه خودکار درصد ضایعات (Scrap Rate).
5. [x] **گام ۵ - ماتریس سلسله‌مراتب تاییدات مالی خرید (Tiered Approval Matrix)**: دسته‌بندی مبالغ خریدهای تدارکات کارخانه به سطوح مدیر بخش (زیر ۵۰ میلیون ریال)، مدیر مجتمع (زیر ۵۰۰ میلیون ریال)، و ارجاع خودکار خریدهای کلان CAPEX به کارتابل مدیرعامل (CEO Approval).
6. [x] **گام ۶ - صدور برگه خروج کالا و گیت‌پاس دیجیتال (Gate Pass)**: ایجاد مجوزهای خروج موقت (تراشکاری/تعمیرات) یا قطعی بار، همراه با تولید توکن امنیتی QR جهت اسکن و احراز اصالت توسط حراست درب اصلی.
7. [x] **گام ۷ - درگاه پیامک اضطراری و آلارم صنعتی (SMS Gateway)**: ارسال پیامک‌های فراخوان تیم فنی، هشدار رسیدن قطعات به حداقل موجودی و اطلاع‌رسانی خریدهای معطل تایید.
8. [x] **گام ۸ - پشتیبانی از استاندارد PWA و حالت کارگاهی**: مانیفست اپلیکیشن وب برای نصب روی تبلت‌های صنعتی کارگاهی و گوشی‌های موبایل پرسنل با دکمه‌های لمسی درشت.
9. [x] **گام ۹ - داشبورد تحلیلی و مانیتورینگ آنلاین کارخانه (Executive BI)**: پایش چراغ‌های آنلاین خطوط ۱ تا ۴ سالن تولید، هشدارهای کسری انبار و دسترسی سریع مدیران به ماژول‌های میدانی.
10. [x] **گام ۱۰ - آزمون‌های خودکار و مستندسازی کامل**: اجرای موفقیت‌آمیز تمام ۱۳ تست یکپارچگی بک‌اند با پوشش کامل منطق‌های جدید و بیلد ۱۰۰٪ موفق فرانت‌اند در Vite.

</div>

---

## 🇬🇧 English Summary & Integration Specification

**Mokarrar (مکرر)** is a unified Enterprise Super App tailored for manufacturing corporations. It orchestrates 4 open-source systems into a single-pane-of-glass experience:
1. **Mokarrar Core (`mokarrar/core/`)**: Full-Stack FastAPI Gateway & React 19 RTL Frontend.
2. **Task Engine (`mokarrar/services/plane/`)**: Plane task & kanban backend engine.
3. **Inventory Engine (`mokarrar/services/inventree/`)**: InvenTree inventory & warehouse engine.
4. **Automation Glue (`mokarrar/services/n8n/`)**: n8n workflow engine connecting PR payments directly to Plane delivery tasks and InvenTree Stock-In receipts.

### Key Architectural Standards Met:
- **Zero Hardcoded Headers/Sidebars**: Unified persistent `AppShell.tsx` dynamically reading context and centralized `navigation.config.ts`.
- **Clean Adapter Architecture**: Robust async HTTP client with retry policies, structured logging, and instant offline mock mode via `MOCK_EXTERNAL_SERVICES=true`.
- **Enterprise Reporting**: Native openpyxl RTL `.xlsx` and python-docx `.docx` export service.
- **Idempotency**: Webhook protection guaranteeing zero double-additions of stock items.
