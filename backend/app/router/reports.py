import csv
import tempfile
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from typing import Literal

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas

from ..auth.authentication import oauth2_scheme, verify_token
from ..database.db import db
from services.violation_categories import map_violation_to_category, normalize_violation_type

router = APIRouter(prefix="/reports", tags=["reports"])


class GenerateReportRequest(BaseModel):
	report_type: Literal["weekly", "monthly", "quarterly", "custom"]
	output_format: Literal["csv", "pdf"]
	start_date: str | None = None
	end_date: str | None = None


def _parse_occurrence(raw: dict) -> datetime | None:
	value = raw.get("violation_time") or raw.get("timestamp")
	if not value:
		return None
	text = str(value).replace("Z", "+00:00")
	try:
		parsed = datetime.fromisoformat(text)
	except ValueError:
		return None
	if parsed.tzinfo is None:
		return parsed.replace(tzinfo=timezone.utc)
	return parsed


def _mapped_bucket(violation_type: str) -> str:
	return str(map_violation_to_category(violation_type) or "other")


def _date_range(payload: GenerateReportRequest) -> tuple[date, date]:
	today = datetime.now(timezone.utc).date()
	if payload.report_type == "weekly":
		return today - timedelta(days=6), today
	if payload.report_type == "monthly":
		return today - timedelta(days=29), today
	if payload.report_type == "quarterly":
		return today - timedelta(days=89), today
	if not payload.start_date or not payload.end_date:
		raise HTTPException(status_code=400, detail="start_date and end_date are required for custom reports")
	try:
		start = date.fromisoformat(payload.start_date)
		end = date.fromisoformat(payload.end_date)
	except ValueError:
		raise HTTPException(status_code=400, detail="Dates must be in YYYY-MM-DD format")
	if end < start:
		raise HTTPException(status_code=400, detail="end_date must be on or after start_date")
	return start, end


@router.post("/generate")
async def generate_report(
	payload: GenerateReportRequest,
	token: str = Depends(oauth2_scheme),
):
	decoded = verify_token(token, require_verified=True)
	user_id = decoded.get("uid")
	user_email = decoded.get("email")
	if not user_id:
		raise HTTPException(status_code=400, detail="User ID missing in token")

	start_date, end_date = _date_range(payload)

	records = []
	seen_ids = set()

	for snap in db.collection("violations").where("user_id", "==", user_id).stream():
		if snap.id in seen_ids:
			continue
		seen_ids.add(snap.id)
		data = snap.to_dict() or {}
		occurred_at = _parse_occurrence(data)
		if not occurred_at:
			continue
		if not (start_date <= occurred_at.date() <= end_date):
			continue
		records.append({
			"id": str(data.get("violation_id") or snap.id),
			"type": normalize_violation_type(str(data.get("violation_type", "unknown"))),
			"bucket": _mapped_bucket(str(data.get("violation_type", "unknown"))),
			"camera": str(data.get("camera_id") or data.get("camera_location") or "Unknown"),
			"timestamp": occurred_at.isoformat(),
			"status": "Resolved" if data.get("resolved") else "Pending",
		})

	if user_email:
		for snap in db.collection("violations").where("email", "==", user_email).stream():
			if snap.id in seen_ids:
				continue
			seen_ids.add(snap.id)
			data = snap.to_dict() or {}
			occurred_at = _parse_occurrence(data)
			if not occurred_at:
				continue
			if not (start_date <= occurred_at.date() <= end_date):
				continue
			records.append({
				"id": str(data.get("violation_id") or snap.id),
				"type": normalize_violation_type(str(data.get("violation_type", "unknown"))),
				"bucket": _mapped_bucket(str(data.get("violation_type", "unknown"))),
				"camera": str(data.get("camera_id") or data.get("camera_location") or "Unknown"),
				"timestamp": occurred_at.isoformat(),
				"status": "Resolved" if data.get("resolved") else "Pending",
			})

	records.sort(key=lambda row: row["timestamp"], reverse=True)

	totals = {"apron": 0, "fire": 0, "gloves": 0, "hair_net": 0}
	for row in records:
		if row["bucket"] in totals:
			totals[row["bucket"]] += 1

	stamp = datetime.now(timezone.utc).strftime("%Y%m%d_%H%M%S")
	label = f"violations_{payload.report_type}_{stamp}"

	if payload.output_format == "csv":
		temp = tempfile.NamedTemporaryFile(delete=False, suffix=".csv")
		path = Path(temp.name)
		temp.close()
		with open(path, "w", newline="", encoding="utf-8") as fp:
			writer = csv.writer(fp)
			writer.writerow(["Report Type", payload.report_type])
			writer.writerow(["Start Date", start_date.isoformat()])
			writer.writerow(["End Date", end_date.isoformat()])
			writer.writerow(["Total Violations", len(records)])
			writer.writerow(["Apron", totals["apron"]])
			writer.writerow(["Hair Net", totals["hair_net"]])
			writer.writerow(["Gloves", totals["gloves"]])
			writer.writerow(["Fire", totals["fire"]])
			writer.writerow([])
			writer.writerow(["Violation ID", "Violation Type", "Mapped Category", "Camera", "Timestamp", "Status"])
			for row in records:
				writer.writerow([row["id"], row["type"], row["bucket"], row["camera"], row["timestamp"], row["status"]])
		return FileResponse(str(path), media_type="text/csv", filename=f"{label}.csv")

	temp = tempfile.NamedTemporaryFile(delete=False, suffix=".pdf")
	path = Path(temp.name)
	temp.close()
	pdf = canvas.Canvas(str(path), pagesize=A4)
	width, height = A4
	y = height - 50

	pdf.setFont("Helvetica-Bold", 16)
	pdf.drawString(40, y, "KitchenEye Violation Report")
	y -= 24
	pdf.setFont("Helvetica", 11)
	pdf.drawString(40, y, f"Type: {payload.report_type.title()}   Range: {start_date.isoformat()} to {end_date.isoformat()}")
	y -= 18
	pdf.drawString(40, y, f"Total: {len(records)} | Apron: {totals['apron']} | Hair Net: {totals['hair_net']} | Gloves: {totals['gloves']} | Fire: {totals['fire']}")
	y -= 26

	pdf.setFont("Helvetica-Bold", 10)
	pdf.drawString(40, y, "Timestamp")
	pdf.drawString(180, y, "Category")
	pdf.drawString(280, y, "Type")
	pdf.drawString(400, y, "Camera")
	y -= 14
	pdf.setFont("Helvetica", 9)

	for row in records:
		if y < 50:
			pdf.showPage()
			y = height - 40
			pdf.setFont("Helvetica", 9)
		pdf.drawString(40, y, row["timestamp"][:19])
		pdf.drawString(180, y, row["bucket"].replace("_", " ").title())
		pdf.drawString(280, y, row["type"][:18])
		pdf.drawString(400, y, row["camera"][:20])
		y -= 12

	pdf.save()
	return FileResponse(str(path), media_type="application/pdf", filename=f"{label}.pdf")
