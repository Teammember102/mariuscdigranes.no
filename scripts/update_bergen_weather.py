#!/usr/bin/env python3
"""Build a tiny same-origin Bergen forecast for a GitHub Pages portfolio."""
import gzip
import json
from datetime import datetime, timedelta, timezone
from email.utils import parsedate_to_datetime
from pathlib import Path
from urllib.error import HTTPError
from urllib.request import Request, urlopen

URL = "https://api.met.no/weatherapi/locationforecast/2.0/compact?lat=60.3929&lon=5.3241"
USER_AGENT = "mariuscdigranes.no/1.0 (https://mariuscdigranes.no; contact: marius.digr@gmail.com)"
OUTPUT = Path("data/bergen-weather.json")


def dt_iso(value):
    if not value:
        return None
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def http_expiry(headers, now):
    value = headers.get("Expires")
    try:
        result = parsedate_to_datetime(value) if value else None
    except (ValueError, TypeError):
        result = None
    return result if result and result > now else now + timedelta(minutes=50)


def iso(dt):
    return dt.astimezone(timezone.utc).isoformat().replace("+00:00", "Z")


def main():
    now = datetime.now(timezone.utc)
    cached = {}
    if OUTPUT.exists():
        try:
            cached = json.loads(OUTPUT.read_text(encoding="utf-8"))
        except (ValueError, OSError):
            cached = {}
    expires = dt_iso(cached.get("sourceExpires"))
    if expires and expires > now and cached.get("hours"):
        cached["checkedAt"] = iso(now)
        OUTPUT.write_text(json.dumps(cached, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
        print("Forecast still fresh — recorded hourly check at", iso(now))
        return

    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "application/json",
        "Accept-Encoding": "gzip",
    }
    if cached.get("lastModified"):
        headers["If-Modified-Since"] = cached["lastModified"]
    request = Request(URL, headers=headers)

    try:
        response = urlopen(request, timeout=30)
    except HTTPError as exc:
        if exc.code == 304 and cached.get("hours"):
            cached["sourceExpires"] = iso(http_expiry(exc.headers, now))
            cached["checkedAt"] = iso(now)
            OUTPUT.parent.mkdir(parents=True, exist_ok=True)
            OUTPUT.write_text(json.dumps(cached, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
            print("Not modified; kept existing MET forecast")
            return
        raise
    with response:
        data = response.read()
        if response.headers.get("Content-Encoding", "").lower() == "gzip":
            data = gzip.decompress(data)
        forecast = json.loads(data.decode("utf-8"))
        source_expires = http_expiry(response.headers, now)
        last_modified = response.headers.get("Last-Modified")

    hours = []
    for entry in forecast["properties"]["timeseries"]:
        stamp = dt_iso(entry.get("time"))
        upcoming = entry.get("data", {}).get("next_1_hours")
        if not stamp or stamp < now - timedelta(hours=1) or not upcoming:
            continue
        instant = entry.get("data", {}).get("instant", {}).get("details", {})
        details = upcoming.get("details", {})
        summary = upcoming.get("summary", {})
        if instant.get("air_temperature") is None:
            continue
        hours.append({
            "time": iso(stamp),
            "temperature": round(float(instant["air_temperature"]), 1),
            "rain": round(float(details.get("precipitation_amount") or 0), 1),
            "symbol": str(summary.get("symbol_code") or "cloudy"),
        })
        if len(hours) >= 48:
            break
    if len(hours) < 24:
        raise RuntimeError("MET returned fewer than 24 hourly periods")
    payload = {
        "location": "Bergen, Norway",
        "source": "MET Norway Locationforecast 2.0",
        "updatedAt": iso(now),
        "checkedAt": iso(now),
        "sourceExpires": iso(source_expires),
        "lastModified": last_modified,
        "hours": hours,
    }
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT.write_text(json.dumps(payload, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("Updated", OUTPUT, "with", len(hours), "forecast hours")


if __name__ == "__main__":
    main()
