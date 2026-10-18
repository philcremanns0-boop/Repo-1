import json
import os
import tempfile
import threading
import unittest
from datetime import datetime, timedelta
from http.server import BaseHTTPRequestHandler, HTTPServer

import bot

TZ = bot.TZ
NOW = datetime(2026, 10, 18, 14, 0, tzinfo=TZ)  # Sonntag


def ts(y, mo, d, h=0, mi=0):
    return int(datetime(y, mo, d, h, mi, tzinfo=TZ).timestamp())


class ParseTests(unittest.TestCase):
    def p(self, s):
        dt, rest = bot.parse_when_prefix(s, NOW)
        return (int(dt.timestamp()) if dt else None), rest

    def test_relative(self):
        self.assertEqual(self.p("in 30m Text"), (int((NOW + timedelta(minutes=30)).timestamp()), "Text"))
        self.assertEqual(self.p("in 2h Text")[0], int((NOW + timedelta(hours=2)).timestamp()))
        self.assertEqual(self.p("in 3d x")[0], int((NOW + timedelta(days=3)).timestamp()))

    def test_days(self):
        self.assertEqual(self.p("morgen 9:00 Anruf"), (ts(2026, 10, 19, 9), "Anruf"))
        self.assertEqual(self.p("morgen"), (ts(2026, 10, 19, 9), ""))
        self.assertEqual(self.p("heute 18:00 x"), (ts(2026, 10, 18, 18), "x"))
        self.assertEqual(self.p("übermorgen 7 Uhr x"), (ts(2026, 10, 20, 7), "x"))

    def test_weekdays(self):
        self.assertEqual(self.p("mo 8:30 x"), (ts(2026, 10, 19, 8, 30), "x"))
        self.assertEqual(self.p("freitag"), (ts(2026, 10, 23, 9), ""))
        self.assertEqual(self.p("so 18:00 x"), (ts(2026, 10, 18, 18), "x"))  # heute, noch in der Zukunft
        self.assertEqual(self.p("so 8:00 x"), (ts(2026, 10, 25, 8), "x"))  # heute schon vorbei, nächste Woche

    def test_short_weekday_needs_time(self):
        self.assertEqual(self.p("so ein Text"), (None, "so ein Text"))

    def test_dates(self):
        self.assertEqual(self.p("24.10. 10:00 x"), (ts(2026, 10, 24, 10), "x"))
        self.assertEqual(self.p("2026-11-02 14:30"), (ts(2026, 11, 2, 14, 30), ""))
        self.assertEqual(self.p("1.1. Neujahr"), (ts(2027, 1, 1, 9), "Neujahr"))
        self.assertEqual(self.p("20:00 Call")[0], ts(2026, 10, 18, 20))

    def test_no_match(self):
        self.assertEqual(self.p("irgendwann")[0], None)


class BotTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False)
        self.tmp.close()
        self.store = bot.Store(self.tmp.name)
        self.bot = bot.Bot(self.store, [111])

    def tearDown(self):
        os.unlink(self.tmp.name)

    def h(self, text, chat=111):
        return self.bot.handle(chat, text, NOW)

    def test_auth(self):
        self.assertIn("Nicht freigegeben", self.h("/add x", chat=999))
        self.assertEqual(self.h("/id", chat=999), "Deine Chat-ID: 999")

    def test_add_parsing(self):
        self.h("/add Angebot schreiben #zahnarzt !1 @morgen 9:00")
        t = self.store.open_tasks(111)[0]
        self.assertEqual((t["text"], t["tag"], t["prio"], t["remind_at"]), ("Angebot schreiben", "zahnarzt", 1, ts(2026, 10, 19, 9)))

    def test_plain_text_is_task(self):
        self.assertIn("Gemerkt als #1", self.h("Milch kaufen"))
        self.assertEqual(self.store.open_tasks(111)[0]["text"], "Milch kaufen")

    def test_bad_time(self):
        self.assertIn("nicht verstanden", self.h("/add x @irgendwann"))
        self.assertEqual(self.store.open_tasks(111), [])

    def test_list_order_done_delete_isolation(self):
        self.h("/add niedrig !3")
        self.h("/add hoch !1 #a")
        self.h("/add mittel")
        lines = self.h("/list").split("\n")
        self.assertTrue(lines[0].startswith("#2") and lines[1].startswith("#3") and lines[2].startswith("#1"))
        self.assertIn("#2", self.h("/list a"))
        self.assertIn("Erledigt: #2", self.h("/done 2"))
        self.assertIn("Nicht gefunden", self.h("/done 2"))
        self.assertIn("Gelöscht: #1", self.h("/del 1"))
        other = bot.Bot(self.store, [111, 222])
        self.assertEqual(other.handle(222, "/list", NOW), "Keine offenen Aufgaben.")

    def test_remind_and_tick(self):
        self.assertIn("Ich erinnere dich", self.h("/remind in 30m Telefonat"))
        sent = []
        self.bot.tick(lambda c, t: sent.append((c, t)), NOW + timedelta(minutes=29))
        self.assertEqual([s for s in sent if s[1].startswith("Erinnerung")], [])
        self.bot.tick(lambda c, t: sent.append((c, t)), NOW + timedelta(minutes=31))
        self.bot.tick(lambda c, t: sent.append((c, t)), NOW + timedelta(minutes=32))
        self.assertEqual(len([s for s in sent if s[1].startswith("Erinnerung: Telefonat")]), 1)

    def test_brief_once_per_day(self):
        self.h("/add wichtig !1")
        self.h("/add fällig @heute 18:00")
        sent = []
        morning = datetime(2026, 10, 19, 8, 5, tzinfo=TZ)
        self.bot.tick(lambda c, t: sent.append(t), morning)
        self.bot.tick(lambda c, t: sent.append(t), morning + timedelta(hours=1))
        briefs = [s for s in sent if s.startswith("Guten Morgen")]
        self.assertEqual(len(briefs), 1)
        self.assertIn("Überfällig", briefs[0])
        self.assertIn("Wichtig", briefs[0])

    def test_past_remind_rejected(self):
        self.assertIn("Vergangenheit", self.h("/remind 2026-10-01 10:00 alt"))


class Mock(BaseHTTPRequestHandler):
    sent = []
    queue = []

    def log_message(self, *a):
        pass

    def do_POST(self):
        body = json.loads(self.rfile.read(int(self.headers["Content-Length"])))
        if self.path.endswith("/getUpdates"):
            out = {"ok": True, "result": Mock.queue if body["offset"] <= Mock.queue[0]["update_id"] else []}
        else:
            Mock.sent.append(body)
            out = {"ok": True, "result": {}}
        data = json.dumps(out).encode()
        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(data)))
        self.end_headers()
        self.wfile.write(data)


class IntegrationTest(unittest.TestCase):
    def test_roundtrip(self):
        srv = HTTPServer(("127.0.0.1", 0), Mock)
        threading.Thread(target=srv.serve_forever, daemon=True).start()
        bot.API_BASE = f"http://127.0.0.1:{srv.server_port}"
        bot.POLL_SECONDS = 1
        Mock.sent = []
        Mock.queue = [
            {"update_id": 10, "message": {"chat": {"id": 111}, "text": "/add Testaufgabe #x"}},
            {"update_id": 11, "message": {"chat": {"id": 111}, "text": "/list"}},
        ]
        tmp = tempfile.NamedTemporaryFile(suffix=".db", delete=False); tmp.close()
        try:
            b = bot.Bot(bot.Store(tmp.name), [111])
            tg = bot.Telegram("TESTTOKEN")
            bot.run_once(b, tg)
            texts = [m["text"] for m in Mock.sent]
            self.assertIn("Gemerkt als #1.", texts)
            self.assertTrue(any("Testaufgabe" in t and "(x)" in t for t in texts))
            self.assertEqual(b.store.meta_get("offset"), "12")
            n = len(Mock.sent)
            bot.run_once(b, tg)  # nichts doppelt verarbeiten
            self.assertEqual([m["text"] for m in Mock.sent][:2], texts[:2])
        finally:
            srv.shutdown()
            os.unlink(tmp.name)


if __name__ == "__main__":
    unittest.main()
