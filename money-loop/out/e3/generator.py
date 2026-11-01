#!/usr/bin/env python3
"""E3: iPad-Planer als PDF (GoodNotes/Notability) per Code.

Aufruf: python3 generator.py   (benoetigt: pip install reportlab)
Erzeugt je Planer einen Unterordner mit PDF und listing-etsy.md.
Alle Symbole sind Vektorformen, keine Emojis.
"""
import datetime as dt
import os
from reportlab.pdfgen import canvas
from reportlab.lib.colors import HexColor

W, H = 1194, 834
OUT = os.path.dirname(os.path.abspath(__file__))
PAPER = HexColor("#FBFAF7")
INK = HexColor("#2B2B2B")
MUTE = HexColor("#8A8A85")
LINE = HexColor("#D9D6CF")
ACC = HexColor("#3F6F62")
ACC_L = HexColor("#E6EEEA")
WKND = HexColor("#F3F1EB")
WHITE = HexColor("#FFFFFF")

MONATE = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli",
          "August", "September", "Oktober", "November", "Dezember"]
MKURZ = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"]
TAGE = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"]
TKURZ = ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"]

X0 = 40            # linker Rand
X1 = W - 74        # rechter Rand des Inhalts (Tab-Spalte rechts)
CW = X1 - X0
TOP = H - 100      # Oberkante Inhalt
BOT = 36


def link(c, key, x, y, w, h):
    c.linkRect("", key, (x, y, x + w, y + h), relative=0, thickness=0)


# ---------- Vektor-Symbole ----------
def icon_home(c, x, y, s=18, col=ACC):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(1.6); c.setLineJoin(1)
    p = c.beginPath()
    p.moveTo(x, y + s * .5); p.lineTo(x + s / 2, y + s); p.lineTo(x + s, y + s * .5)
    c.drawPath(p, stroke=1, fill=0)
    p = c.beginPath()
    p.moveTo(x + s * .17, y + s * .45); p.lineTo(x + s * .17, y); p.lineTo(x + s * .83, y)
    p.lineTo(x + s * .83, y + s * .45)
    c.drawPath(p, stroke=1, fill=0)
    c.restoreState()


def icon_chev(c, x, y, s=14, left=True, col=ACC):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(2); c.setLineCap(1); c.setLineJoin(1)
    p = c.beginPath()
    if left:
        p.moveTo(x + s * .65, y); p.lineTo(x + s * .15, y + s / 2); p.lineTo(x + s * .65, y + s)
    else:
        p.moveTo(x + s * .35, y); p.lineTo(x + s * .85, y + s / 2); p.lineTo(x + s * .35, y + s)
    c.drawPath(p, stroke=1, fill=0)
    c.restoreState()


def checkbox(c, x, y, s=13):
    c.saveState(); c.setStrokeColor(MUTE); c.setLineWidth(.8)
    c.roundRect(x, y, s, s, 2.5, stroke=1, fill=0)
    c.restoreState()


def circle(c, x, y, r):
    c.saveState(); c.setStrokeColor(LINE); c.setLineWidth(.9)
    c.circle(x, y, r, stroke=1, fill=0)
    c.restoreState()


def txt(c, s, x, y, size=10, font="Helvetica", col=INK, align="l"):
    c.setFont(font, size); c.setFillColor(col)
    if align == "l":
        c.drawString(x, y, s)
    elif align == "r":
        c.drawRightString(x, y, s)
    else:
        c.drawCentredString(x, y, s)


def lines(c, x, y_top, w, n, gap=26, col=LINE):
    c.saveState(); c.setStrokeColor(col); c.setLineWidth(.5)
    for i in range(n):
        yy = y_top - (i + 1) * gap
        c.line(x, yy, x + w, yy)
    c.restoreState()


def panel(c, x, y, w, h, fill=None, stroke=LINE, r=8):
    c.saveState(); c.setStrokeColor(stroke); c.setLineWidth(.8)
    if fill is not None:
        c.setFillColor(fill)
    c.roundRect(x, y, w, h, r, stroke=1, fill=1 if fill is not None else 0)
    c.restoreState()


def button(c, x, y, w, h, label, key, size=12, fill=ACC_L, col=ACC):
    panel(c, x, y, w, h, fill=fill, stroke=fill, r=7)
    txt(c, label, x + w / 2, y + h / 2 - size * .35, size, "Helvetica-Bold", col, "c")
    link(c, key, x, y, w, h)


# ---------- Seitengeruest ----------
class Doc:
    def __init__(self, path, title, tabs, home="start"):
        self.c = canvas.Canvas(path, pagesize=(W, H))
        self.c.setTitle(title)
        self.c.setAuthor("Software-generiert (Python, reportlab)")
        self.c.setSubject(title)
        self.tabs = tabs
        self.home = home
        self.title = title

    def page(self, key, head, sub="", active=None, prev=None, nxt=None, outline=None, level=0):
        c = self.c
        c.bookmarkPage(key)
        if outline:
            c.addOutlineEntry(outline, key, level=level, closed=False)
        c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
        # Kopf
        txt(c, head, X0, H - 56, 28, "Helvetica-Bold", INK)
        if sub:
            txt(c, sub, X0, H - 78, 12, "Helvetica", MUTE)
        c.setStrokeColor(ACC); c.setLineWidth(2); c.line(X0, H - 88, X0 + 54, H - 88)
        # Navigation oben rechts
        nx = X1
        icon_home(c, nx - 18, H - 58, 18); link(c, self.home, nx - 30, H - 66, 40, 34)
        if nxt:
            icon_chev(c, nx - 56, H - 57, 16, left=False); link(c, nxt, nx - 66, H - 66, 30, 34)
        if prev:
            icon_chev(c, nx - 92, H - 57, 16, left=True); link(c, prev, nx - 102, H - 66, 30, 34)
        # Tabs rechts
        n = len(self.tabs)
        th = min(54, (H - 80) / n)
        y = H - 40
        for label, k in self.tabs:
            y -= th
            on = (label == active)
            c.saveState()
            c.setFillColor(ACC if on else ACC_L); c.setStrokeColor(PAPER); c.setLineWidth(2)
            c.roundRect(W - 62 if on else W - 56, y + 2, 80, th - 4, 8, stroke=0, fill=1)
            c.restoreState()
            txt(c, label, W - 31 + (-3 if on else 0), y + th / 2 - 3.5, 10.5, "Helvetica-Bold",
                WHITE if on else ACC, "c")
            link(c, k, W - 62, y, 62, th)
        return c

    def next(self):
        self.c.showPage()

    def save(self):
        self.c.save()


def cover(d, key, title, sub, lines_txt):
    c = d.c
    c.bookmarkPage(key)
    c.addOutlineEntry("Start", key, level=0)
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(ACC); c.rect(0, 0, 18, H, stroke=0, fill=1)
    return c


# ---------- Planer 1: Wochenplaner 2027 ----------
def wochenplaner():
    year = 2027
    path = os.path.join(OUT, "wochenplaner-2027", "wochenplaner-2027.pdf")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    first_monday = dt.date(2027, 1, 4)  # ISO-Woche 1 von 2027
    weeks = [first_monday + dt.timedelta(days=7 * i) for i in range(52)]
    tabs = [("Start", "start"), ("Wochen", "wochen")] + [(MKURZ[m], f"m{m+1}") for m in range(12)]
    d = Doc(path, "Wochenplaner 2027", tabs)
    c = d.c

    # Start
    c.bookmarkPage("start"); c.addOutlineEntry("Start", "start", 0)
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(ACC); c.rect(0, 0, 18, H, stroke=0, fill=1)
    txt(c, "Wochenplaner", 80, H - 150, 58, "Helvetica-Bold", INK)
    txt(c, "2027", 80, H - 220, 58, "Helvetica-Bold", ACC)
    txt(c, "52 Wochen · 12 Monate · klickbare Tabs", 82, H - 256, 16, "Helvetica", MUTE)
    c.setStrokeColor(ACC); c.setLineWidth(2.5); c.line(82, H - 276, 150, H - 276)
    txt(c, "Monate", 82, H - 330, 13, "Helvetica-Bold", MUTE)
    for m in range(12):
        bx = 82 + (m % 4) * 168; by = H - 400 - (m // 4) * 62
        button(c, bx, by, 154, 48, MONATE[m], f"m{m+1}", 14)
    button(c, 82, H - 610, 322, 48, "Alle 52 Wochen", "wochen", 14, fill=ACC, col=WHITE)
    txt(c, "Tippe auf Monat oder Woche. Die Tabs am rechten Rand und das Haus-Symbol", 82, 90, 12, "Helvetica", MUTE)
    txt(c, "führen auf jeder Seite zurück. Wochen laufen von Montag bis Sonntag (ISO-Kalenderwochen).", 82, 72, 12, "Helvetica", MUTE)
    d.next()

    # Wochenuebersicht
    d.page("wochen", "Wochenübersicht", "Alle Kalenderwochen 2027", "Wochen", prev="start", nxt="w1",
           outline="Wochen", level=0)
    cols = 4; bw = (CW - 3 * 14) / cols; bh = 44
    for i, mon in enumerate(weeks):
        col = i // 13; row = i % 13
        bx = X0 + col * (bw + 14); by = TOP - 8 - (row + 1) * (bh + 6) + 6
        so = mon + dt.timedelta(days=6)
        panel(c, bx, by, bw, bh, fill=WHITE, r=7)
        txt(c, f"KW {i+1:02d}", bx + 14, by + bh / 2 - 4, 13, "Helvetica-Bold", ACC)
        txt(c, f"{mon.day}. {MKURZ[mon.month-1]} - {so.day}. {MKURZ[so.month-1]}", bx + 70, by + bh / 2 - 4, 12, "Helvetica", INK)
        link(c, f"w{i+1}", bx, by, bw, bh)
    d.next()

    # Monate
    for m in range(1, 13):
        first = dt.date(year, m, 1)
        ndays = (dt.date(year + (m == 12), m % 12 + 1, 1) - first).days
        offset = first.weekday()
        nrows = (offset + ndays + 6) // 7
        d.page(f"m{m}", f"{MONATE[m-1]} {year}", "Monatsübersicht · KW antippen", MKURZ[m - 1],
               prev="start" if m == 1 else f"m{m-1}", nxt=None if m == 12 else f"m{m+1}",
               outline=MONATE[m - 1], level=1)
        kwW = 46; gap = 6
        cw = (CW - kwW - 7 * gap) / 7
        hh = 24
        ch = (TOP - BOT - hh - 8) / nrows
        txt(c, "KW", X0 + kwW / 2, TOP - 14, 10, "Helvetica-Bold", MUTE, "c")
        for i in range(7):
            txt(c, TKURZ[i], X0 + kwW + gap + i * (cw + gap) + 8, TOP - 14, 10.5, "Helvetica-Bold", MUTE)
        for r in range(nrows):
            gy = TOP - hh - (r + 1) * ch + 4
            # Kalenderwoche der Zeile
            rowstart = first + dt.timedelta(days=r * 7 - offset)
            wk = (rowstart - first_monday).days // 7 + 1
            if 1 <= wk <= 52:
                button(c, X0, gy, kwW, ch - 6, str(wk), f"w{wk}", 13)
            else:
                panel(c, X0, gy, kwW, ch - 6, fill=WKND, stroke=WKND)
                txt(c, "-", X0 + kwW / 2, gy + (ch - 6) / 2 - 4, 12, "Helvetica", MUTE, "c")
            for i in range(7):
                cell = r * 7 + i - offset + 1
                cx = X0 + kwW + gap + i * (cw + gap)
                if 1 <= cell <= ndays:
                    panel(c, cx, gy, cw, ch - 6, fill=WKND if i >= 5 else WHITE, r=6)
                    txt(c, str(cell), cx + 9, gy + ch - 6 - 19, 13, "Helvetica-Bold", INK)
                else:
                    panel(c, cx, gy, cw, ch - 6, fill=None, stroke=LINE, r=6)
        d.next()

    # Wochen
    for i, mon in enumerate(weeks, start=1):
        so = mon + dt.timedelta(days=6)
        sub = f"{mon.day}. {MONATE[mon.month-1]} bis {so.day}. {MONATE[so.month-1]} {so.year}" if mon.month != so.month or mon.year != so.year else f"{mon.day}. bis {so.day}. {MONATE[so.month-1]} {so.year}"
        d.page(f"w{i}", f"Kalenderwoche {i}", sub, MKURZ[mon.month - 1],
               prev=f"w{i-1}" if i > 1 else "wochen", nxt=f"w{i+1}" if i < 52 else None,
               outline=f"KW {i}" if i in (1, 14, 27, 40, 52) else None, level=2)
        # Monats-Link
        button(c, X1 - 330, H - 62, 120, 30, "Monat " + MKURZ[mon.month - 1], f"m{mon.month}", 11)
        g = 12
        cw = (CW - 3 * g) / 4
        rh = (TOP - BOT - g) / 2
        for k in range(8):
            row, col = divmod(k, 4)
            x = X0 + col * (cw + g); y = TOP - (row + 1) * rh - row * g + (g if False else 0)
            if k < 7:
                day = mon + dt.timedelta(days=k)
                panel(c, x, y, cw, rh, fill=WKND if k >= 5 else WHITE)
                txt(c, TAGE[k], x + 14, y + rh - 24, 14, "Helvetica-Bold", ACC if k < 5 else MUTE)
                txt(c, f"{day.day}. {MKURZ[day.month-1]}", x + cw - 14, y + rh - 24, 12, "Helvetica", MUTE, "r")
                lines(c, x + 14, y + rh - 30, cw - 28, int((rh - 40) // 28), 28)
            else:
                panel(c, x, y, cw, rh, fill=ACC_L, stroke=ACC_L)
                txt(c, "Fokus & Aufgaben", x + 14, y + rh - 24, 14, "Helvetica-Bold", ACC)
                n = int((rh - 50) // 30)
                for j in range(n):
                    yy = y + rh - 56 - j * 30
                    checkbox(c, x + 14, yy)
                    c.setStrokeColor(ACC); c.setLineWidth(.4); c.line(x + 36, yy, x + cw - 14, yy)
        d.next()
    d.save()
    return path, 1 + 1 + 12 + 52


# ---------- Planer 2: Habit-Tracker ----------
def habit():
    year = 2027
    path = os.path.join(OUT, "habit-tracker-2027", "habit-tracker-2027.pdf")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    tabs = [("Start", "start"), ("Ziele", "ziele")] + [(MKURZ[m], f"m{m+1}") for m in range(12)] + [("Jahr", "jahr")]
    d = Doc(path, "Habit-Tracker 2027", tabs)
    c = d.c

    c.bookmarkPage("start"); c.addOutlineEntry("Start", "start", 0)
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(ACC); c.rect(0, 0, 18, H, stroke=0, fill=1)
    txt(c, "Habit-Tracker", 80, H - 150, 58, "Helvetica-Bold", INK)
    txt(c, "2027", 80, H - 220, 58, "Helvetica-Bold", ACC)
    txt(c, "10 Gewohnheiten · 12 Monate · Jahresrückblick", 82, H - 256, 16, "Helvetica", MUTE)
    c.setStrokeColor(ACC); c.setLineWidth(2.5); c.line(82, H - 276, 150, H - 276)
    txt(c, "Monate", 82, H - 330, 13, "Helvetica-Bold", MUTE)
    for m in range(12):
        button(c, 82 + (m % 4) * 168, H - 400 - (m // 4) * 62, 154, 48, MONATE[m], f"m{m+1}", 14)
    button(c, 82, H - 610, 154, 48, "Meine Ziele", "ziele", 14, fill=ACC, col=WHITE)
    button(c, 250, H - 610, 154, 48, "Jahresrückblick", "jahr", 14, fill=ACC, col=WHITE)
    txt(c, "Trage zuerst auf der Seite Ziele deine Gewohnheiten ein, schreibe sie dann in die Monatsseiten.", 82, 90, 12, "Helvetica", MUTE)
    txt(c, "Fülle pro erledigtem Tag einen Kreis aus. Tabs und Haus-Symbol führen auf jeder Seite zurück.", 82, 72, 12, "Helvetica", MUTE)
    d.next()

    d.page("ziele", "Meine Gewohnheiten", "Name, Anlass und Ziel pro Woche", "Ziele", prev="start", nxt="m1", outline="Ziele", level=0)
    colw = [40, 380, 380, CW - 800]
    hx = X0
    heads = ["Nr.", "Gewohnheit", "Wann / Auslöser", "Ziel pro Woche"]
    ry = TOP
    xs = [X0]
    for w_ in colw[:-1]:
        xs.append(xs[-1] + w_)
    for x, h_ in zip(xs, heads):
        txt(c, h_, x + 6, ry - 14, 11, "Helvetica-Bold", MUTE)
    rh = 52
    for i in range(10):
        y = ry - 24 - (i + 1) * rh + 8
        panel(c, X0, y, CW, rh - 8, fill=WHITE, r=7)
        txt(c, str(i + 1), X0 + 20, y + (rh - 8) / 2 - 5, 15, "Helvetica-Bold", ACC, "c")
        for x in xs[1:]:
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(x, y + 8, x, y + rh - 16)
    d.next()

    for m in range(1, 13):
        first = dt.date(year, m, 1)
        nd = (dt.date(year + (m == 12), m % 12 + 1, 1) - first).days
        d.page(f"m{m}", f"{MONATE[m-1]} {year}", "Kreis ausfüllen, wenn erledigt", MKURZ[m - 1],
               prev="start" if m == 1 else f"m{m-1}", nxt=f"m{m+1}" if m < 12 else "jahr",
               outline=MONATE[m - 1], level=1)
        lw = 230; cw = (CW - lw) / 31
        hy = TOP - 6
        # Kopfzeile Tage
        for dd in range(nd):
            day = first + dt.timedelta(days=dd)
            cx = X0 + lw + dd * cw + cw / 2
            if day.weekday() >= 5:
                c.setFillColor(WKND); c.rect(cx - cw / 2, hy - 34 - 360, cw, 360 + 10, stroke=0, fill=1)
            txt(c, str(dd + 1), cx, hy - 12, 9.5, "Helvetica-Bold", INK, "c")
            txt(c, TKURZ[day.weekday()][0], cx, hy - 24, 8, "Helvetica", MUTE, "c")
        txt(c, "Gewohnheit", X0 + 6, hy - 20, 11, "Helvetica-Bold", MUTE)
        rh = 36
        for r in range(10):
            yc = hy - 34 - r * rh - rh / 2
            c.setStrokeColor(LINE); c.setLineWidth(.5)
            c.line(X0, yc - rh / 2, X1, yc - rh / 2)
            txt(c, str(r + 1), X0 + 6, yc - 4, 11, "Helvetica-Bold", ACC)
            for dd in range(nd):
                circle(c, X0 + lw + dd * cw + cw / 2, yc, min(9, cw / 2 - 2.5))
        by = BOT
        bh = hy - 34 - 10 * rh - 16 - by
        bw = (CW - 2 * 12) / 3
        for j, t in enumerate(["Das lief gut", "Das war schwer", "Fokus nächster Monat"]):
            x = X0 + j * (bw + 12)
            panel(c, x, by, bw, bh, fill=ACC_L if j == 2 else WHITE, stroke=ACC_L if j == 2 else LINE)
            txt(c, t, x + 14, by + bh - 22, 13, "Helvetica-Bold", ACC)
            lines(c, x + 14, by + bh - 28, bw - 28, int((bh - 36) // 26), 26, ACC if j == 2 else LINE)
        d.next()

    d.page("jahr", "Jahresrückblick 2027", "Ein Satz pro Monat, Monat antippen zum Nachschlagen", "Jahr",
           prev="m12", nxt=None, outline="Jahresrückblick", level=0)
    bw = (CW - 3 * 12) / 4; bh = (TOP - BOT - 2 * 12) / 3 - 6
    for m in range(12):
        x = X0 + (m % 4) * (bw + 12); y = TOP - (m // 4 + 1) * (bh + 12) + 12
        panel(c, x, y, bw, bh, fill=WHITE)
        txt(c, MONATE[m], x + 14, y + bh - 24, 14, "Helvetica-Bold", ACC)
        link(c, f"m{m+1}", x, y + bh - 36, bw, 36)
        lines(c, x + 14, y + bh - 30, bw - 28, int((bh - 40) // 26), 26)
    d.next()
    d.save()
    return path, 1 + 1 + 12 + 1


# ---------- Planer 3: Studienplan ----------
def studienplan():
    path = os.path.join(OUT, "studienplan-semester", "studienplan-semester.pdf")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    start = dt.date(2027, 10, 18)  # Montag, Datum anpassbar im Generator
    tabs = [("Start", "start"), ("Semester", "sem"), ("Plan", "plan"), ("Wochen", "s1"),
            ("Prüfung", "pruef"), ("Noten", "noten")]
    d = Doc(path, "Studienplan Semester", tabs)
    c = d.c

    c.bookmarkPage("start"); c.addOutlineEntry("Start", "start", 0)
    c.setFillColor(PAPER); c.rect(0, 0, W, H, stroke=0, fill=1)
    c.setFillColor(ACC); c.rect(0, 0, 18, H, stroke=0, fill=1)
    txt(c, "Studienplan", 80, H - 150, 58, "Helvetica-Bold", INK)
    txt(c, "Semester", 80, H - 220, 58, "Helvetica-Bold", ACC)
    txt(c, "Fächer · Stundenplan · 16 Wochenraster · Prüfungen · Noten", 82, H - 256, 16, "Helvetica", MUTE)
    c.setStrokeColor(ACC); c.setLineWidth(2.5); c.line(82, H - 276, 150, H - 276)
    for j, (t, k) in enumerate([("Semesterübersicht", "sem"), ("Stundenplan", "plan"), ("Prüfungen", "pruef"), ("Noten", "noten")]):
        button(c, 82 + j * 168, H - 350, 154, 48, t, k, 13, fill=ACC, col=WHITE)
    txt(c, "Wochen", 82, H - 400, 13, "Helvetica-Bold", MUTE)
    for i in range(16):
        mon = start + dt.timedelta(days=7 * i)
        button(c, 82 + (i % 4) * 168, H - 470 - (i // 4) * 58, 154, 44, f"Woche {i+1} · {mon.day}.{mon.month}.", f"s{i+1}", 12)
    txt(c, "Startdatum 18.10.2027 (Wintersemester, Annahme). Tabs rechts und Haus-Symbol führen auf jeder Seite zurück.", 82, 72, 12, "Helvetica", MUTE)
    d.next()

    # Semesteruebersicht
    d.page("sem", "Semesterübersicht", "Fächer, Zeiten, Ziele", "Semester", prev="start", nxt="plan", outline="Semester", level=0)
    heads = ["Fach", "Dozent/in", "ECTS", "Raum", "Termin"]
    cw_ = [330, 220, 70, 120, 0]
    cw_[4] = 760 - sum(cw_[:4])
    tw = 760
    xs = [X0]
    for w_ in cw_[:-1]:
        xs.append(xs[-1] + w_)
    for x, h_ in zip(xs, heads):
        txt(c, h_, x + 8, TOP - 14, 11, "Helvetica-Bold", MUTE)
    for i in range(9):
        y = TOP - 24 - (i + 1) * 50 + 8
        panel(c, X0, y, tw, 42, fill=WHITE, r=7)
        for x in xs[1:]:
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(x, y + 8, x, y + 34)
    gx = X0 + tw + 16; gw = CW - tw - 16
    panel(c, gx, BOT, gw, TOP - BOT - 6, fill=ACC_L, stroke=ACC_L)
    txt(c, "Ziele im Semester", gx + 14, TOP - 30, 14, "Helvetica-Bold", ACC)
    lines(c, gx + 14, TOP - 34, gw - 28, 14, 30, ACC)
    d.next()

    # Stundenplan
    d.page("plan", "Stundenplan", "Fester Wochenrhythmus", "Plan", prev="sem", nxt="s1", outline="Stundenplan", level=0)
    raster(c, X0, BOT + 6, CW, TOP - BOT - 10, 7, 8, 20, ["Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"], None)
    d.next()

    # Wochen
    for i in range(1, 17):
        mon = start + dt.timedelta(days=7 * (i - 1))
        so = mon + dt.timedelta(days=6)
        d.page(f"s{i}", f"Semesterwoche {i}", f"{mon.day}.{mon.month}. bis {so.day}.{so.month}.{so.year}", "Wochen",
               prev=f"s{i-1}" if i > 1 else "plan", nxt=f"s{i+1}" if i < 16 else "pruef",
               outline="Wochen" if i == 1 else None, level=0)
        bh = 130
        raster(c, X0, BOT + bh + 12, CW, TOP - BOT - bh - 16, 7, 8, 20,
               [f"{TKURZ[k]} {(mon + dt.timedelta(days=k)).day}.{(mon + dt.timedelta(days=k)).month}." for k in range(7)], None)
        bw = (CW - 12) / 2
        for j, t in enumerate(["Aufgaben und Abgaben", "Lernziele der Woche"]):
            x = X0 + j * (bw + 12)
            panel(c, x, BOT, bw, bh, fill=ACC_L, stroke=ACC_L)
            txt(c, t, x + 14, BOT + bh - 22, 13, "Helvetica-Bold", ACC)
            for q in range(3):
                yy = BOT + bh - 52 - q * 26
                checkbox(c, x + 14, yy); c.setStrokeColor(ACC); c.setLineWidth(.4); c.line(x + 36, yy, x + bw - 14, yy)
        d.next()

    d.page("pruef", "Prüfungsplaner", "Termine, Lernphasen, Stand", "Prüfung", prev="s16", nxt="noten", outline="Prüfungen", level=0)
    heads = ["Fach", "Datum", "Uhrzeit", "Raum", "Lernstart", "Stand"]
    widths = [300, 140, 110, 130, 140, CW - 820]
    xs = [X0]
    for w_ in widths[:-1]:
        xs.append(xs[-1] + w_)
    for x, h_ in zip(xs, heads):
        txt(c, h_, x + 8, TOP - 14, 11, "Helvetica-Bold", MUTE)
    for i in range(10):
        y = TOP - 24 - (i + 1) * 54 + 8
        panel(c, X0, y, CW, 46, fill=WHITE, r=7)
        for x in xs[1:]:
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(x, y + 8, x, y + 38)
        for q in range(3):
            checkbox(c, xs[-1] + 14 + q * 34, y + 17)
    d.next()

    d.page("noten", "Notenübersicht", "Note × ECTS, Durchschnitt selbst berechnen", "Noten", prev="pruef", nxt=None, outline="Noten", level=0)
    heads = ["Fach", "ECTS", "Note", "Gewichtung", "Bemerkung"]
    widths = [340, 100, 100, 130, CW - 670]
    xs = [X0]
    for w_ in widths[:-1]:
        xs.append(xs[-1] + w_)
    for x, h_ in zip(xs, heads):
        txt(c, h_, x + 8, TOP - 14, 11, "Helvetica-Bold", MUTE)
    for i in range(10):
        y = TOP - 24 - (i + 1) * 46 + 8
        panel(c, X0, y, CW, 38, fill=WHITE, r=7)
        for x in xs[1:]:
            c.setStrokeColor(LINE); c.setLineWidth(.5); c.line(x, y + 7, x, y + 31)
    y = BOT + 6
    panel(c, X0, y, CW, 50, fill=ACC_L, stroke=ACC_L)
    txt(c, "Durchschnitt", X0 + 14, y + 19, 14, "Helvetica-Bold", ACC)
    txt(c, "Summe ECTS", X0 + 400, y + 19, 12, "Helvetica-Bold", ACC)
    d.next()
    d.save()
    return path, 1 + 1 + 1 + 16 + 1 + 1


def raster(c, x, y, w, h, ncols, h0, h1, heads, _):
    """Zeitraster: Spalten = Tage, Zeilen = Stunden."""
    tw = 46; hh = 28
    cw = (w - tw) / ncols
    nrows = h1 - h0
    rh = (h - hh) / nrows
    for k in range(ncols):
        cx = x + tw + k * cw
        if k >= 5:
            c.setFillColor(WKND); c.rect(cx, y, cw, h - hh, stroke=0, fill=1)
        txt(c, heads[k], cx + cw / 2, y + h - 18, 11, "Helvetica-Bold", ACC if k < 5 else MUTE, "c")
    c.setStrokeColor(LINE); c.setLineWidth(.5)
    for r in range(nrows + 1):
        yy = y + (h - hh) - r * rh
        c.line(x + tw - 6, yy, x + w, yy)
        if r < nrows:
            txt(c, f"{h0 + r}:00", x + tw - 10, yy - 12, 9.5, "Helvetica", MUTE, "r")
    for k in range(ncols + 1):
        cx = x + tw + k * cw
        c.line(cx, y, cx, y + h - hh)


# ---------- Etsy-Listings ----------
KENNZ = ("Mit Hilfe von Software erstellt: Dieser Planer wurde mit Hilfe von Software (eigenes Python-Skript, "
         "keine generative Bild-KI) automatisch erzeugt und vor Veröffentlichung von Hand geprüft. "
         "Etsy-Feld \"Wer hat es hergestellt\" und Angabe zu KI-/Tool-Einsatz im Shop vor dem Einstellen "
         "gegen die aktuelle Etsy-Richtlinie prüfen (Etsy Creativity Standards).")

GOODNOTES = """## Import in GoodNotes (iPad)

1. PDF-Datei per Download-Link/Dateien-App auf das iPad laden.
2. GoodNotes öffnen, Plus-Symbol, "Importieren", PDF auswählen.
3. Bei "Als Dokument importieren" bleiben die Tabs und Links erhalten. Nicht als "Seiten in bestehendes Dokument" einfügen, wenn die Links zwischen den Seiten funktionieren sollen (Seitenverweise setzen die Seitenreihenfolge voraus).
4. Tabs am rechten Rand, Haus-Symbol und Pfeile oben antippen (Lesemodus bzw. Stift deaktiviert); Monate und Wochen sind ebenfalls antippbar.
5. Mit dem Apple Pencil direkt in die Felder schreiben. Notability: Import über "Importieren", Links sind dort ebenfalls aktiv."""

HINWEIS = """## Rechtliches und Annahmen

- Preis ist eine Annahme (E), keine Marktdaten. Laut memory/recherche.md liegen für Etsy keine belastbaren Zahlen vor.
- Listing-Gebühr laut Recherche 0,20 USD je Listing (Sekundärquelle, vor Nutzung prüfen).
- Nichts wurde veröffentlicht. Vor Veröffentlichung: Mockup-Bilder erstellen, Lizenzhinweis (nur persönliche Nutzung) ergänzen, Etsy-Richtlinien und Steuerstatus (Kleinunternehmer § 19 UStG, siehe recherche.md) prüfen. VOR VEROEFFENTLICHUNG PRUEFEN."""


def listing(folder, titel, beschr, tags, preis, seiten):
    assert len(tags) == 13 and all(len(t) <= 20 for t in tags), (titel, [t for t in tags if len(t) > 20])
    assert len(titel) <= 140
    md = f"""# Etsy-Listing: {titel}

## Titel ({len(titel)} Zeichen)

{titel}

## Beschreibung

{beschr}

Umfang: {seiten} Seiten, PDF, 1194 x 834 pt (iPad, 4:3 quer), mit klickbaren Tabs und Links.

Bitte beachten: Digitales Produkt, kein Versand. Nach dem Kauf erhältst du den Download. Nur für den persönlichen Gebrauch, keine Weitergabe oder Weiterverkauf.

## Tags (13, je höchstens 20 Zeichen)

{chr(10).join(f"{i+1}. {t}" for i, t in enumerate(tags))}

## Kennzeichnung

{KENNZ}

{GOODNOTES}

## Preisvorschlag (Annahme)

{preis}

{HINWEIS}
"""
    with open(os.path.join(folder, "listing-etsy.md"), "w", encoding="utf-8") as f:
        f.write(md)


def listings(seiten):
    base = OUT
    listing(os.path.join(base, "wochenplaner-2027"),
            "Digitaler Wochenplaner 2027 PDF für GoodNotes und Notability, iPad Planer Deutsch, 52 Wochen",
            "Ruhiger, deutscher Wochenplaner für das Jahr 2027 zum Beschriften mit dem Apple Pencil.\n\n"
            "Enthalten: Startseite, Monatsübersichten für alle 12 Monate, 52 Wochenseiten (Montag bis Sonntag, "
            "ISO-Kalenderwochen), Wochenübersicht zum Springen. Klickbare Tabs am rechten Rand, Kalenderwochen in der "
            "Monatsansicht verlinken direkt auf die Woche. Vorwärts-, Rückwärts- und Home-Symbol auf jeder Seite.\n\n"
            "Zurückhaltende Gestaltung in einer Akzentfarbe, deutsche Beschriftung.",
            ["Wochenplaner 2027", "digitaler Planer", "GoodNotes Planer", "Notability Planer", "iPad Planer",
             "Planer 2027 PDF", "Kalender 2027", "Wochenkalender", "Digital Planner DE", "Apple Pencil",
             "Tablet Planer", "Terminplaner PDF", "Jahresplaner 2027"],
            "Vorschlag 6,90 EUR brutto (E, Annahme, ungeprüft). Aktionspreis zum Start 4,90 EUR denkbar (E).", seiten["w"])
    listing(os.path.join(base, "habit-tracker-2027"),
            "Digitaler Habit Tracker 2027 PDF GoodNotes iPad, Gewohnheiten Tracker Deutsch, 12 Monate",
            "Gewohnheiten über das ganze Jahr 2027 festhalten: ein digitaler Habit-Tracker für GoodNotes, Notability und "
            "andere PDF-Apps.\n\nEnthalten: Startseite, Seite für deine Gewohnheiten und Ziele, 12 Monatsseiten mit je "
            "10 Gewohnheiten (Kreise zum Ausfüllen, Wochenenden hinterlegt), drei Rückblick-Felder pro Monat und ein "
            "Jahresrückblick. Klickbare Tabs für alle Monate.\n\nRuhige Gestaltung, eine Akzentfarbe, deutsche Beschriftung.",
            ["Habit Tracker", "Habit Tracker 2027", "Gewohnheiten", "digitaler Planer", "GoodNotes Vorlage",
             "iPad Planer", "Notability Planer", "Gewohnheitstracker", "Selbstorganisation", "Jahresrueckblick",
             "Routine Planer", "Apple Pencil", "Planer PDF deutsch"],
            "Vorschlag 4,90 EUR brutto (E, Annahme, ungeprüft). Bundle mit Wochenplaner 9,90 EUR denkbar (E).", seiten["h"])
    listing(os.path.join(base, "studienplan-semester"),
            "Digitaler Studienplaner Semester PDF GoodNotes iPad, Stundenplan Uni, Lernplaner Deutsch",
            "Studienplaner für ein Semester zum Schreiben auf dem iPad.\n\nEnthalten: Startseite, Semesterübersicht mit "
            "Fächern, ECTS und Zielen, Stundenplan (Montag bis Sonntag, 8 bis 20 Uhr), 16 Semesterwochen mit Zeitraster, "
            "Aufgaben und Lernzielen, Prüfungsplaner und Notenübersicht. Klickbare Tabs und Links. Startdatum in der "
            "Vorlage: 18.10.2027 (Wintersemester, Annahme).\n\n"
            "Ruhige Gestaltung, eine Akzentfarbe, deutsche Beschriftung.",
            ["Studienplaner", "Stundenplan Uni", "Lernplaner", "Semesterplaner", "GoodNotes Planer",
             "iPad Planer", "Notability Planer", "Studium Planer", "Uni Planer PDF", "digitaler Planer",
             "Pruefungsplaner", "Apple Pencil", "Studienplan"],
            "Vorschlag 7,90 EUR brutto (E, Annahme, ungeprüft).", seiten["s"])


if __name__ == "__main__":
    res = {}
    for k, fn in (("w", wochenplaner), ("h", habit), ("s", studienplan)):
        p, n = fn()
        res[k] = n
        print(p, n, "Seiten")
    listings(res)
