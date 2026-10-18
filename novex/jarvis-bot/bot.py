#!/usr/bin/env python3
"""Jarvis-Light: Telegram-Bot für Aufgaben, Erinnerungen und eine Morgenübersicht.

Nur Standardbibliothek, keine Abos. Konfiguration über Umgebungsvariablen (siehe .env.example).
Start:  python3 bot.py
Seed:   python3 bot.py seed backlog.json
"""
import json
import os
import re
import sqlite3
import sys
import time
import urllib.error
import urllib.request
from datetime import datetime, timedelta

try:
    from zoneinfo import ZoneInfo
except ImportError:  # Python < 3.9
    ZoneInfo = None

TZ_NAME = os.environ.get("BOT_TZ", "Europe/Berlin")
try:
    TZ = ZoneInfo(TZ_NAME) if ZoneInfo else None
except Exception:
    TZ = None
API_BASE = os.environ.get("TELEGRAM_API_BASE", "https://api.telegram.org")
DB_PATH = os.environ.get("BOT_DB", os.path.join(os.path.dirname(os.path.abspath(__file__)), "jarvis.db"))
BRIEF_TIME = os.environ.get("BRIEF_TIME", "08:00")
POLL_SECONDS = int(os.environ.get("POLL_SECONDS", "20"))

DAYS = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]
WD = {"mo": 0, "montag": 0, "di": 1, "dienstag": 1, "mi": 2, "mittwoch": 2, "do": 3, "donnerstag": 3,
      "fr": 4, "freitag": 4, "sa": 5, "samstag": 5, "so": 6, "sonntag": 6}

HELP = """Jarvis-Light. Du schreibst, ich merke es mir und erinnere dich.

Aufgaben
/add Text #tag !1 @morgen 9:00   neue Aufgabe (Tag, Priorität 1 hoch bis 3 niedrig und Erinnerung sind optional)
Einfach Text senden   speichert eine Aufgabe ohne Tag
/list oder /list tag   offene Aufgaben (nach Priorität)
/today   heute fällig und überfällig
/done 3   oder /done 3,4,5   erledigt
/del 3   löschen
/remind in 30m Text   Erinnerung (Beispiele: in 2h, heute 18:00, morgen 9:00, mo 8:30, 24.10. 10:00)
/brief   Übersicht jetzt
/id   deine Chat-ID (für die Konfiguration)

Zeitangaben: in 30m, in 2h, in 3d, heute 18:00, morgen, übermorgen 9:00, mo 9:00, freitag, 24.10., 24.10.2026 10:00, 2026-10-24 10:00."""


# ---------------------------------------------------------------- Zeit
def now_local():
    return datetime.now(TZ) if TZ else datetime.now().astimezone()


def mk(y, mo, d, h, mi, ref):
    """Lokale Zeit erzeugen, mit Zeitzone von ref."""
    return datetime(y, mo, d, h, mi, tzinfo=ref.tzinfo)


def fmt_ts(ts):
    dt = datetime.fromtimestamp(ts, TZ) if TZ else datetime.fromtimestamp(ts)
    return f"{DAYS[dt.weekday()]} {dt.day:02d}.{dt.month:02d}. {dt.hour:02d}:{dt.minute:02d}"


_TIME = r"(?:\s+(?:um\s+)?(?:(\d{1,2}):(\d{2})|(\d{1,2})\s*uhr))?"


def _hm(m, i):
    """Stunde/Minute aus den Gruppen i (hh:mm) und i+2 (h uhr) lesen."""
    if m.group(i) is not None:
        return int(m.group(i)), int(m.group(i + 1))
    if m.group(i + 2) is not None:
        return int(m.group(i + 2)), 0
    return None


def parse_when_prefix(s, now):
    """Liest eine Zeitangabe am Anfang von s. Gibt (datetime, Rest) oder (None, s) zurück."""
    low = s.lower()
    m = re.match(r"\s*in\s+(\d+)\s*(m|min|minuten?|h|std|stunden?|d|t|tage?n?)\b", low)
    if m:
        n, unit = int(m.group(1)), m.group(2)
        delta = timedelta(minutes=n) if unit.startswith("m") else timedelta(hours=n) if unit[0] in "hs" else timedelta(days=n)
        return now + delta, s[m.end():].strip()
    m = re.match(r"\s*(heute|morgen|übermorgen|uebermorgen)" + _TIME, low)
    if m:
        day = {"heute": 0, "morgen": 1}.get(m.group(1), 2)
        base = now + timedelta(days=day)
        hm = _hm(m, 2)
        if hm is None:
            hm = (18, 0) if day == 0 else (9, 0)
        dt = mk(base.year, base.month, base.day, hm[0], hm[1], now)
        return dt, s[m.end():].strip()
    m = re.match(r"\s*(montag|dienstag|mittwoch|donnerstag|freitag|samstag|sonntag|mo|di|mi|do|fr|sa|so)\b" + _TIME, low)
    # Kurzformen (mo, di, ...) brauchen eine Uhrzeit, sonst Verwechslung mit normalen Wörtern wie "so" oder "mi"
    if m and (len(m.group(1)) > 2 or _hm(m, 2) is not None):
        hm = _hm(m, 2) or (9, 0)
        ahead = (WD[m.group(1)] - now.weekday()) % 7
        day = now + timedelta(days=ahead)
        dt = mk(day.year, day.month, day.day, hm[0], hm[1], now)
        if dt <= now:
            day = now + timedelta(days=ahead + 7)
            dt = mk(day.year, day.month, day.day, hm[0], hm[1], now)
        return dt, s[m.end():].strip()
    m = re.match(r"\s*(\d{4})-(\d{2})-(\d{2})" + _TIME, low)
    if m:
        hm = _hm(m, 4) or (9, 0)
        return mk(int(m.group(1)), int(m.group(2)), int(m.group(3)), hm[0], hm[1], now), s[m.end():].strip()
    m = re.match(r"\s*(\d{1,2})\.(\d{1,2})\.(?:(\d{4}))?" + _TIME, low)
    if m:
        hm = _hm(m, 4) or (9, 0)
        year = int(m.group(3)) if m.group(3) else now.year
        dt = mk(year, int(m.group(2)), int(m.group(1)), hm[0], hm[1], now)
        if not m.group(3) and dt < now - timedelta(days=1):
            dt = mk(year + 1, int(m.group(2)), int(m.group(1)), hm[0], hm[1], now)
        return dt, s[m.end():].strip()
    m = re.match(r"\s*(\d{1,2}):(\d{2})\b", low)
    if m:
        dt = mk(now.year, now.month, now.day, int(m.group(1)), int(m.group(2)), now)
        if dt <= now:
            dt += timedelta(days=1)
        return dt, s[m.end():].strip()
    return None, s


# ---------------------------------------------------------------- Speicher
class Store:
    def __init__(self, path):
        self.db = sqlite3.connect(path, check_same_thread=False)
        self.db.row_factory = sqlite3.Row
        self.db.executescript("""
            CREATE TABLE IF NOT EXISTS tasks (
              id INTEGER PRIMARY KEY AUTOINCREMENT, chat_id INTEGER NOT NULL, text TEXT NOT NULL,
              tag TEXT, prio INTEGER NOT NULL DEFAULT 2, remind_at INTEGER, reminded INTEGER NOT NULL DEFAULT 0,
              done_at INTEGER, created_at INTEGER NOT NULL);
            CREATE TABLE IF NOT EXISTS meta (k TEXT PRIMARY KEY, v TEXT);
        """)
        self.db.commit()

    def add(self, chat_id, text, tag=None, prio=2, remind_at=None):
        cur = self.db.execute(
            "INSERT INTO tasks (chat_id, text, tag, prio, remind_at, created_at) VALUES (?,?,?,?,?,?)",
            (chat_id, text, tag, prio, remind_at, int(time.time())))
        self.db.commit()
        return cur.lastrowid

    def open_tasks(self, chat_id, tag=None):
        q = "SELECT * FROM tasks WHERE chat_id=? AND done_at IS NULL"
        args = [chat_id]
        if tag:
            q += " AND lower(tag)=?"
            args.append(tag.lower())
        q += " ORDER BY prio ASC, COALESCE(remind_at, 9999999999) ASC, id ASC"
        return self.db.execute(q, args).fetchall()

    def get(self, chat_id, task_id):
        return self.db.execute("SELECT * FROM tasks WHERE chat_id=? AND id=?", (chat_id, task_id)).fetchone()

    def done(self, chat_id, task_id):
        cur = self.db.execute("UPDATE tasks SET done_at=? WHERE chat_id=? AND id=? AND done_at IS NULL", (int(time.time()), chat_id, task_id))
        self.db.commit()
        return cur.rowcount > 0

    def delete(self, chat_id, task_id):
        cur = self.db.execute("DELETE FROM tasks WHERE chat_id=? AND id=?", (chat_id, task_id))
        self.db.commit()
        return cur.rowcount > 0

    def due_reminders(self, now_ts):
        return self.db.execute(
            "SELECT * FROM tasks WHERE done_at IS NULL AND reminded=0 AND remind_at IS NOT NULL AND remind_at<=?", (now_ts,)).fetchall()

    def mark_reminded(self, task_id):
        self.db.execute("UPDATE tasks SET reminded=1 WHERE id=?", (task_id,))
        self.db.commit()

    def meta_get(self, k, default=None):
        r = self.db.execute("SELECT v FROM meta WHERE k=?", (k,)).fetchone()
        return r["v"] if r else default

    def meta_set(self, k, v):
        self.db.execute("INSERT INTO meta (k, v) VALUES (?, ?) ON CONFLICT(k) DO UPDATE SET v=excluded.v", (k, str(v)))
        self.db.commit()


# ---------------------------------------------------------------- Logik
def line(t):
    mark = {1: "!", 2: "·", 3: "-"}.get(t["prio"], "·")
    tag = f" ({t['tag']})" if t["tag"] else ""
    due = f"  ⏰ {fmt_ts(t['remind_at'])}" if t["remind_at"] else ""
    return f"#{t['id']} {mark} {t['text']}{tag}{due}"


class Bot:
    def __init__(self, store, allowed):
        self.store = store
        self.allowed = set(allowed)

    def handle(self, chat_id, text, now=None):
        """Verarbeitet eine Nachricht, gibt die Antwort als Text zurück."""
        now = now or now_local()
        text = (text or "").strip()
        if not text:
            return None
        cmd, _, rest = text.partition(" ")
        cmd = cmd.lower().split("@")[0] if cmd.startswith("/") else ""
        rest = rest.strip() if cmd else text
        if cmd in ("/id",):
            return f"Deine Chat-ID: {chat_id}"
        if chat_id not in self.allowed:
            return f"Nicht freigegeben. Trage {chat_id} in ALLOWED_CHAT_IDS ein und starte den Bot neu."
        if cmd in ("/start", "/help", "/hilfe"):
            return HELP
        if cmd in ("/add", "/neu", "") and rest:
            return self.add(chat_id, rest, now)
        if cmd in ("/list", "/liste"):
            return self.list(chat_id, rest.lstrip("#") or None)
        if cmd in ("/today", "/heute"):
            return self.today(chat_id, now)
        if cmd in ("/done", "/erledigt"):
            return self.done(chat_id, rest)
        if cmd in ("/del", "/loeschen", "/löschen"):
            return self.delete(chat_id, rest)
        if cmd in ("/remind", "/erinnere"):
            return self.remind(chat_id, rest, now)
        if cmd == "/brief":
            return self.brief(chat_id, now)
        if cmd:
            return "Den Befehl kenne ich nicht. /help zeigt alles."
        return None

    def add(self, chat_id, rest, now):
        remind_at = None
        m = re.search(r"\s@(.+)$", " " + rest)
        if m:
            dt, _ = parse_when_prefix(m.group(1), now)
            if dt is None:
                return "Die Zeitangabe nach @ habe ich nicht verstanden. Beispiele: @morgen 9:00, @in 2h, @mo 8:30, @24.10. 10:00"
            remind_at = int(dt.timestamp())
            rest = (" " + rest)[: m.start()].strip()
        tag = None
        mt = re.search(r"(?:^|\s)#(\w+)", rest)
        if mt:
            tag = mt.group(1)
            rest = (rest[: mt.start()] + " " + rest[mt.end():]).strip()
        prio = 2
        mp = re.search(r"(?:^|\s)!([123])\b", rest)
        if mp:
            prio = int(mp.group(1))
            rest = (rest[: mp.start()] + " " + rest[mp.end():]).strip()
        if not rest:
            return "Da fehlt der Text der Aufgabe."
        tid = self.store.add(chat_id, rest, tag, prio, remind_at)
        extra = f", Erinnerung {fmt_ts(remind_at)}" if remind_at else ""
        return f"Gemerkt als #{tid}{extra}."

    def remind(self, chat_id, rest, now):
        dt, text = parse_when_prefix(rest, now)
        if dt is None or not text:
            return "Format: /remind in 30m Text, /remind morgen 9:00 Text oder /remind mo 8:30 Text"
        if dt <= now:
            return "Der Zeitpunkt liegt in der Vergangenheit."
        tid = self.store.add(chat_id, text, None, 2, int(dt.timestamp()))
        return f"Ich erinnere dich am {fmt_ts(int(dt.timestamp()))} (#{tid})."

    def list(self, chat_id, tag):
        rows = self.store.open_tasks(chat_id, tag)
        if not rows:
            return "Keine offenen Aufgaben." if not tag else f"Keine offenen Aufgaben mit #{tag}."
        return "\n".join(line(r) for r in rows)

    def today(self, chat_id, now):
        end = mk(now.year, now.month, now.day, 23, 59, now).timestamp()
        rows = [r for r in self.store.open_tasks(chat_id) if r["remind_at"] and r["remind_at"] <= end]
        if not rows:
            return "Heute nichts fällig."
        return "\n".join(line(r) for r in rows)

    def _ids(self, rest):
        return [int(x) for x in re.findall(r"\d+", rest)]

    def done(self, chat_id, rest):
        ids = self._ids(rest)
        if not ids:
            return "Format: /done 3 oder /done 3,4"
        ok = [i for i in ids if self.store.done(chat_id, i)]
        bad = [i for i in ids if i not in ok]
        return ("Erledigt: " + ", ".join(f"#{i}" for i in ok) if ok else "") + (("\nNicht gefunden oder schon erledigt: " + ", ".join(f"#{i}" for i in bad)) if bad else "")

    def delete(self, chat_id, rest):
        ids = self._ids(rest)
        if not ids:
            return "Format: /del 3"
        ok = [i for i in ids if self.store.delete(chat_id, i)]
        return ("Gelöscht: " + ", ".join(f"#{i}" for i in ok)) if ok else "Nicht gefunden."

    def brief(self, chat_id, now):
        rows = self.store.open_tasks(chat_id)
        if not rows:
            return "Guten Morgen. Keine offenen Aufgaben."
        start = mk(now.year, now.month, now.day, 0, 0, now).timestamp()
        end = start + 86400
        overdue = [r for r in rows if r["remind_at"] and r["remind_at"] < start]
        today = [r for r in rows if r["remind_at"] and start <= r["remind_at"] < end]
        top = [r for r in rows if r["prio"] == 1 and r not in today and r not in overdue][:5]
        out = [f"Guten Morgen. {len(rows)} offene Aufgaben."]
        if overdue:
            out += ["", "Überfällig:"] + [line(r) for r in overdue[:8]]
        if today:
            out += ["", "Heute:"] + [line(r) for r in today[:8]]
        if top:
            out += ["", "Wichtig (Priorität 1):"] + [line(r) for r in top]
        return "\n".join(out)

    # Zeitgesteuert: Erinnerungen und Morgenübersicht
    def tick(self, send, now=None):
        now = now or now_local()
        for t in self.store.due_reminders(int(now.timestamp())):
            send(t["chat_id"], f"Erinnerung: {t['text']} (#{t['id']})")
            self.store.mark_reminded(t["id"])
        hh, mm = (int(x) for x in BRIEF_TIME.split(":"))
        if (now.hour, now.minute) >= (hh, mm):
            today = now.strftime("%Y-%m-%d")
            for chat in self.allowed:
                if self.store.meta_get(f"brief:{chat}") != today:
                    send(chat, self.brief(chat, now))
                    self.store.meta_set(f"brief:{chat}", today)


# ---------------------------------------------------------------- Telegram
class Telegram:
    def __init__(self, token):
        self.url = f"{API_BASE}/bot{token}/"

    def call(self, method, payload, timeout=40):
        req = urllib.request.Request(self.url + method, data=json.dumps(payload).encode(), headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return json.loads(r.read().decode())

    def send(self, chat_id, text):
        for i in range(0, len(text), 3900):
            try:
                self.call("sendMessage", {"chat_id": chat_id, "text": text[i:i + 3900]})
            except Exception as e:  # Netzwerkfehler dürfen den Bot nicht beenden
                print("sendMessage fehlgeschlagen:", e, file=sys.stderr)

    def updates(self, offset):
        return self.call("getUpdates", {"offset": offset, "timeout": POLL_SECONDS, "allowed_updates": ["message"]}, timeout=POLL_SECONDS + 15).get("result", [])


def run_once(bot, tg):
    """Ein Durchlauf: Nachrichten holen, beantworten, Zeitsteuerung ausführen."""
    offset = int(bot.store.meta_get("offset", "0"))
    for u in tg.updates(offset):
        offset = u["update_id"] + 1
        msg = u.get("message") or {}
        text, chat = msg.get("text"), (msg.get("chat") or {}).get("id")
        if text and chat is not None:
            reply = bot.handle(chat, text)
            if reply:
                tg.send(chat, reply)
        bot.store.meta_set("offset", offset)
    bot.tick(tg.send)


def seed(store, chat_id, path):
    with open(path, encoding="utf-8") as f:
        items = json.load(f)
    now = now_local()
    for it in items:
        remind_at = None
        if it.get("remind"):
            dt, _ = parse_when_prefix(it["remind"], now)
            remind_at = int(dt.timestamp()) if dt else None
        store.add(chat_id, it["text"], it.get("tag"), it.get("prio", 2), remind_at)
    print(f"{len(items)} Aufgaben importiert.")


def main():
    allowed = [int(x) for x in re.findall(r"-?\d+", os.environ.get("ALLOWED_CHAT_IDS", ""))]
    store = Store(DB_PATH)
    if len(sys.argv) >= 3 and sys.argv[1] == "seed":
        if not allowed:
            sys.exit("ALLOWED_CHAT_IDS setzen, dann seed ausführen.")
        seed(store, allowed[0], sys.argv[2])
        return
    token = os.environ.get("TELEGRAM_BOT_TOKEN")
    if not token:
        sys.exit("TELEGRAM_BOT_TOKEN fehlt. Token bei @BotFather in Telegram erzeugen.")
    if not allowed:
        print("Hinweis: ALLOWED_CHAT_IDS ist leer. Schreibe dem Bot /id und trage die Zahl ein.", file=sys.stderr)
    bot, tg = Bot(store, allowed), Telegram(token)
    print("Jarvis-Light läuft. Zeitzone:", TZ_NAME, "· Morgenübersicht:", BRIEF_TIME)
    backoff = 1
    while True:
        try:
            run_once(bot, tg)
            backoff = 1
        except (urllib.error.URLError, TimeoutError, ConnectionError, OSError) as e:
            print("Netzwerkfehler:", e, "· neuer Versuch in", backoff, "s", file=sys.stderr)
            time.sleep(backoff)
            backoff = min(backoff * 2, 60)


if __name__ == "__main__":
    main()
