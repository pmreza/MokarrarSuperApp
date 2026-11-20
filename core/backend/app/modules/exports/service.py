import io
from typing import Any
from openpyxl import Workbook
from openpyxl.styles import Alignment, Border, Font, PatternFill, Side
from docx import Document
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Inches, Pt, RGBColor


# Helper styles
HEADER_FILL = PatternFill(start_color="1E3A8A", end_color="1E3A8A", fill_type="solid")  # Corporate Navy
HEADER_FONT = Font(name="Tahoma", size=11, bold=True, color="FFFFFF")
DATA_FONT = Font(name="Tahoma", size=10)
TITLE_FONT = Font(name="Tahoma", size=14, bold=True, color="1E3A8A")
SUBTITLE_FONT = Font(name="Tahoma", size=9, italic=True, color="475569")
THIN_BORDER = Border(
    left=Side(style="thin", color="CBD5E1"),
    right=Side(style="thin", color="CBD5E1"),
    top=Side(style="thin", color="CBD5E1"),
    bottom=Side(style="thin", color="CBD5E1"),
)


def export_tasks_to_excel(tasks: list[dict[str, Any]]) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "تسک‌های مکرر"

    # CRITICAL RTL SETTING FOR PERSIAN EXCEL
    ws.views.sheetView[0].rightToLeft = True

    # Title Banner
    ws.merge_cells("A1:G1")
    title_cell = ws["A1"]
    title_cell.value = "سامانه یکپارچه مکرر (Mokarrar) - گزارش تسک‌ها و وظایف سازمانی"
    title_cell.font = TITLE_FONT
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 35

    ws.merge_cells("A2:G2")
    sub_cell = ws["A2"]
    sub_cell.value = f"تعداد کل تسک‌ها: {len(tasks)} | گزارش رسمی محرمانه درون‌سازمانی"
    sub_cell.font = SUBTITLE_FONT
    sub_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[2].height = 20

    # Headers
    headers = ["ردیف", "شناسه تسک", "عنوان تسک", "وضعیت", "اولویت", "مسئول انجام", "تاریخ سررسید"]
    ws.row_dimensions[3].height = 26

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=3, column=col_idx, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = THIN_BORDER

    # Status & Priority Persian translations
    status_map = {
        "backlog": "بک‌لاگ",
        "todo": "در انتظار",
        "in_progress": "در حال انجام",
        "done": "تکمیل شده",
    }
    priority_map = {
        "urgent": "فوری و اضطراری",
        "high": "بالا",
        "medium": "متوسط",
        "low": "پایین",
    }

    # Data Rows
    for row_idx, task in enumerate(tasks, 4):
        ws.row_dimensions[row_idx].height = 22
        st_fa = status_map.get(task.get("state", ""), task.get("state", ""))
        pr_fa = priority_map.get(task.get("priority", ""), task.get("priority", ""))

        row_values = [
            row_idx - 3,
            task.get("id", ""),
            task.get("title", ""),
            st_fa,
            pr_fa,
            task.get("assignee_name", "-"),
            task.get("due_date", "-"),
        ]

        for col_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = DATA_FONT
            cell.border = THIN_BORDER
            if col_idx in (1, 2, 4, 5, 7):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="right", vertical="center")

    # Column Widths
    col_widths = [8, 14, 45, 16, 16, 25, 16]
    for i, w in enumerate(col_widths, 1):
        col_letter = chr(64 + i)
        ws.column_dimensions[col_letter].width = w

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def export_tasks_to_docx(tasks: list[dict[str, Any]]) -> io.BytesIO:
    doc = Document()

    # Document Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run_title = p_title.add_run("شرکت صنایع تولیدی مکرر\nگزارش وضعیت تسک‌ها و پروژه‌ها")
    run_title.font.name = "Tahoma"
    run_title.font.size = Pt(16)
    run_title.font.bold = True
    run_title.font.color.rgb = RGBColor(30, 58, 138)

    p_sub = doc.add_paragraph()
    p_sub.alignment = WD_ALIGN_PARAGRAPH.RIGHT
    run_sub = p_sub.add_run(f"تاریخ گزارش: ۱۴۰۵/۰۳/۱۱  |  تعداد رکوردها: {len(tasks)}")
    run_sub.font.name = "Tahoma"
    run_sub.font.size = Pt(10)
    run_sub.font.color.rgb = RGBColor(100, 116, 139)

    doc.add_paragraph()

    # Table
    table = doc.add_table(rows=1, cols=5)
    table.style = "Light Grid Accent 1"

    hdr_cells = table.rows[0].cells
    hdr_titles = ["سررسید", "مسئول", "اولویت", "وضعیت", "عنوان تسک"]

    for i, title in enumerate(hdr_titles):
        cell = hdr_cells[i]
        p = cell.paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
        run = p.add_run(title)
        run.font.name = "Tahoma"
        run.font.bold = True
        run.font.size = Pt(10)

    status_map = {"backlog": "بک‌لاگ", "todo": "در انتظار", "in_progress": "در حال انجام", "done": "تکمیل شده"}
    priority_map = {"urgent": "فوری", "high": "بالا", "medium": "متوسط", "low": "پایین"}

    for task in tasks:
        row_cells = table.add_row().cells
        st_fa = status_map.get(task.get("state", ""), task.get("state", ""))
        pr_fa = priority_map.get(task.get("priority", ""), task.get("priority", ""))

        row_data = [
            task.get("due_date", "-"),
            task.get("assignee_name", "-"),
            pr_fa,
            st_fa,
            task.get("title", ""),
        ]
        for i, val in enumerate(row_data):
            p = row_cells[i].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.RIGHT
            run = p.add_run(str(val))
            run.font.name = "Tahoma"
            run.font.size = Pt(9)

    output = io.BytesIO()
    doc.save(output)
    output.seek(0)
    return output


def export_procurement_to_excel(requests: list[dict[str, Any]]) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "درخواست‌های خرید"
    ws.views.sheetView[0].rightToLeft = True

    ws.merge_cells("A1:F1")
    title_cell = ws["A1"]
    title_cell.value = "سامانه تدارکات و خرید مکرر - فهرست درخواست‌های خرید"
    title_cell.font = TITLE_FONT
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 35

    headers = ["ردیف", "شماره درخواست", "عنوان سفارش", "دپارتمان", "مبلغ برآوردی (ریال)", "وضعیت تایید"]
    ws.row_dimensions[2].height = 25

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = THIN_BORDER

    pr_status_map = {
        "DRAFT": "پیش‌نویس",
        "PENDING_APPROVAL": "در انتظار تایید مدیر",
        "APPROVED": "تایید شده",
        "REJECTED": "رد شده",
        "PAID": "پرداخت شده",
        "DELIVERED": "تحویل انبار شده",
    }

    for row_idx, pr in enumerate(requests, 3):
        ws.row_dimensions[row_idx].height = 22
        st_fa = pr_status_map.get(pr.get("status", ""), pr.get("status", ""))
        cost_formatted = f"{pr.get('total_estimated_cost', 0):,.0f}"

        row_values = [
            row_idx - 2,
            pr.get("request_number", ""),
            pr.get("title", ""),
            pr.get("department", ""),
            cost_formatted,
            st_fa,
        ]
        for col_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = DATA_FONT
            cell.border = THIN_BORDER
            if col_idx in (1, 2, 4, 6):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            elif col_idx == 5:
                cell.alignment = Alignment(horizontal="left", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="right", vertical="center")

    col_widths = [8, 18, 45, 20, 24, 22]
    for i, w in enumerate(col_widths, 1):
        ws.column_dimensions[chr(64 + i)].width = w

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output


def export_inventory_to_excel(parts: list[dict[str, Any]]) -> io.BytesIO:
    wb = Workbook()
    ws = wb.active
    ws.title = "موجودی انبار"
    ws.views.sheetView[0].rightToLeft = True

    ws.merge_cells("A1:G1")
    title_cell = ws["A1"]
    title_cell.value = "انبار مرکزی شرکت مکرر - گزارش کاردکس و موجودی قطعات"
    title_cell.font = TITLE_FONT
    title_cell.alignment = Alignment(horizontal="center", vertical="center")
    ws.row_dimensions[1].height = 35

    headers = ["ردیف", "کد کالا (IPN)", "نام قطعه / تجهیز", "دسته‌بندی", "موجودی فعلی", "حداقل موجودی", "موقعیت در انبار"]
    ws.row_dimensions[2].height = 25

    for col_idx, header in enumerate(headers, 1):
        cell = ws.cell(row=2, column=col_idx, value=header)
        cell.fill = HEADER_FILL
        cell.font = HEADER_FONT
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.border = THIN_BORDER

    for row_idx, p in enumerate(parts, 3):
        ws.row_dimensions[row_idx].height = 22
        stock = p.get("total_in_stock", 0.0)
        min_stock = p.get("minimum_stock", 0.0)
        unit = p.get("units", "عدد")

        row_values = [
            row_idx - 2,
            p.get("IPN", ""),
            p.get("name", ""),
            p.get("category_name", ""),
            f"{stock:g} {unit}",
            f"{min_stock:g} {unit}",
            p.get("default_location", "انبار مرکزی"),
        ]
        for col_idx, val in enumerate(row_values, 1):
            cell = ws.cell(row=row_idx, column=col_idx, value=val)
            cell.font = DATA_FONT
            cell.border = THIN_BORDER
            if col_idx in (1, 2, 5, 6):
                cell.alignment = Alignment(horizontal="center", vertical="center")
            else:
                cell.alignment = Alignment(horizontal="right", vertical="center")

            # Highlight low stock in soft red
            if col_idx == 5 and stock <= min_stock:
                cell.fill = PatternFill(start_color="FEE2E2", end_color="FEE2E2", fill_type="solid")
                cell.font = Font(name="Tahoma", size=10, bold=True, color="991B1B")

    col_widths = [8, 18, 40, 24, 18, 18, 25]
    for i, w in enumerate(col_widths, 1):
        ws.column_dimensions[chr(64 + i)].width = w

    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
