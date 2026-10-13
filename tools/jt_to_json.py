#!/usr/bin/env python3
"""Convert a JTExchange / Jyotish Tools Android database (jtdata.db) into a
Jyotish Query import file ({"jyotish_charts": [...]}), for Settings > Import.

Usage:  python3 tools/jt_to_json.py path/to/jtdata.db [out.json]

jtdata.db is SQLite with one table, Charts (format confirmed against the
JTExchange.jar classes DBtoFiles/FilesToDB, whose field names latsouth /
loneast / zeast / dstval mark the sign conventions):

  Name, Place, Notes   text
  Month, Day, Year     birth date
  Time                 minutes after local midnight (no seconds)
  Zone                 minutes WEST of UTC (420 = UTC-07:00, -330 = UTC+05:30),
                       already including DST where the user entered it
  ZoneDST              extra DST minutes (0 in every file seen so far)
  Longitude            arc-minutes, positive = WEST
  Latitude             arc-minutes, positive = NORTH

Only charts are written. The app's Import step creates any missing atlas
locations itself (with an IANA time zone), so no jyotish_atlas key is needed.
"""
import json
import re
import sqlite3
import sys
from pathlib import Path


def clean_place(place: str) -> str:
    # "Santa Monica, CA:USA" -> "Santa Monica, CA, USA"; "Sofia , Bulgaria" -> "Sofia, Bulgaria"
    p = place.replace(':', ', ')
    p = re.sub(r'\s*,\s*', ', ', p)
    p = re.sub(r'\s+', ' ', p)
    return p.strip(' ,')


def convert(db_path: Path) -> list[dict]:
    con = sqlite3.connect(f'file:{db_path}?mode=ro', uri=True)
    con.row_factory = sqlite3.Row
    charts = []
    for r in con.execute('SELECT * FROM Charts ORDER BY upper(Name)'):
        minutes = int(r['Time'])
        offset_min = -int(r['Zone']) + int(r['ZoneDST'])
        rec = {
            'name': r['Name'].strip(),
            'date': f"{int(r['Year']):04d}-{int(r['Month']):02d}-{int(r['Day']):02d}",
            'time': f'{minutes // 60:02d}:{minutes % 60:02d}:00',
            'lat': f"{int(r['Latitude']) / 60:.4f}",
            'lon': f"{-int(r['Longitude']) / 60:.4f}",
            'tz': offset_min / 60,
            'locationName': clean_place(r['Place']),
        }
        notes = (r['Notes'] or '').strip()
        if notes:
            rec['notes'] = notes
        charts.append(rec)
    return charts


def main() -> None:
    if len(sys.argv) < 2:
        sys.exit(__doc__)
    db = Path(sys.argv[1])
    out = Path(sys.argv[2]) if len(sys.argv) > 2 else db.with_name(db.stem + '-import.json')
    charts = convert(db)
    out.write_text(json.dumps({'jyotish_charts': charts}, indent=1, ensure_ascii=False), encoding='utf-8')
    places = {c['locationName'] for c in charts}
    print(f'{len(charts)} charts, {len(places)} distinct places -> {out}')


if __name__ == '__main__':
    main()
