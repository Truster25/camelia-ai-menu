"""Draws the planned system architecture (Figure 1 of the handover document).

Run:  python3 tools/make_architecture_diagram.py
Out:  figures/architecture.png  (drawn at its final printed width, 16 cm)

Needs matplotlib. Uses Liberation Sans (Arial-compatible) when it is installed.
"""
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.patches import FancyArrowPatch, FancyBboxPatch

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "figures" / "architecture.png"

families = ["DejaVu Sans"]
liberation = sorted(Path("/usr/share/fonts/truetype/liberation").glob("LiberationSans-*.ttf"))
if liberation:
    for f in liberation:
        font_manager.fontManager.addfont(str(f))
    families.insert(0, "Liberation Sans")
plt.rcParams["font.family"] = families

INK = "#1F2933"
MUTED = "#52606D"
ACCENT = "#1E6B52"
ACCENT_FILL = "#E3F1EA"
BOX_FILL = "#F4F6F8"
BORDER = "#8A96A3"
WHITE = "#FFFFFF"

W, H = 6.3, 4.95  # inches; 6.3 in = 16 cm, the width used in the document
fig = plt.figure(figsize=(W, H), dpi=300)
ax = fig.add_axes([0, 0, 1, 1])
ax.set_xlim(0, W)
ax.set_ylim(0, H)
ax.axis("off")


def box(x, y, w, h, fill=BOX_FILL, edge=BORDER, lw=0.9, dashed=False):
    ax.add_patch(FancyBboxPatch(
        (x, y), w, h,
        boxstyle="round,pad=0,rounding_size=0.06",
        facecolor=fill, edgecolor=edge, linewidth=lw,
        linestyle=(0, (4, 3)) if dashed else "solid",
    ))


def line(x, y, s, size=8, weight="normal", color=INK, ha="center"):
    """One line of text with its baseline at y, so rows line up across boxes."""
    ax.text(x, y, s, fontsize=size, fontweight=weight, color=color, ha=ha, va="baseline")


def tier_label(y_mid, s):
    ax.text(0.08, y_mid, s, fontsize=7.5, fontweight="bold", color=MUTED,
            ha="left", va="center", linespacing=1.25)


def arrow(x, y_from, y_to, dashed=False):
    ax.add_patch(FancyArrowPatch(
        (x, y_from), (x, y_to),
        arrowstyle="-|>", mutation_scale=9, linewidth=1.0,
        color=MUTED, linestyle=(0, (4, 3)) if dashed else "solid",
        shrinkA=0, shrinkB=0,
    ))


def arrow_label(x, y_mid, s, ha="left"):
    ax.text(x, y_mid, s, fontsize=8, color=MUTED, ha=ha, va="center_baseline")


L, R = 1.12, 6.22          # left / right edge of the drawing area
MID = (L + R) / 2

# ---- Row 1: users -----------------------------------------------------
y, h = 4.30, 0.57
half = (R - L - 0.2) / 2
cust_x = L + half / 2
mgr_x = L + half + 0.2 + half / 2
box(L, y, half, h, fill=WHITE)
line(cust_x, y + 0.34, "Customer", 9, "bold")
line(cust_x, y + 0.14, "phone browser, by QR code or link", 8, color=MUTED)
box(L + half + 0.2, y, half, h, fill=WHITE)
line(mgr_x, y + 0.34, "Restaurant manager", 9, "bold")
line(mgr_x, y + 0.14, "laptop or tablet browser", 8, color=MUTED)
tier_label(y + h / 2, "USERS")
users_bottom = y

# ---- Row 2: frontend --------------------------------------------------
y, h = 3.18, 0.78
box(L, y, R - L, h)
line(MID, y + 0.545, "FRONTEND: web application", 9, "bold")
line(MID, y + 0.335, "React, TypeScript, Tailwind CSS, shadcn/ui", 8)
line(MID, y + 0.135, "works on phones and laptops  |  hosted on Vercel", 8, color=MUTED)
tier_label(y + h / 2, "PRESENTATION\nLAYER")
front_top, front_bottom = y + h, y

arrow(cust_x, users_bottom, front_top)
arrow(mgr_x, users_bottom, front_top)
arrow_label(MID, (users_bottom + front_top) / 2, "HTTPS", ha="center")

# ---- Row 3: backend ---------------------------------------------------
y, h = 1.24, 1.60
box(L, y, R - L, h)
line(MID, y + h - 0.24, "BACKEND: application server", 9, "bold")
line(MID, y + h - 0.45, "Python, FastAPI, SQLAlchemy, scikit-learn  |  hosted on Render", 8, color=MUTED)
tier_label(y + h / 2, "APPLICATION\nLAYER")
back_top, back_bottom = y + h, y

arrow(MID, front_bottom, back_top)
arrow_label(MID + 0.12, (front_bottom + back_top) / 2, "REST API (JSON over HTTPS)")

pad, gap = 0.13, 0.1
iw = (R - L - 2 * pad - 3 * gap) / 4
iy, ih = y + 0.13, 0.86
modules = [
    ("Accounts", "and roles", "customer, manager", False),
    ("Menu, orders", "and ratings", "daily records", False),
    ("Recommendation", "engine", "hybrid AI model", True),
    ("Reports and", "dashboard", "sales and ratings", False),
]
for i, (t1, t2, sub, highlight) in enumerate(modules):
    ix = L + pad + i * (iw + gap)
    cx = ix + iw / 2
    box(ix, iy, iw, ih,
        fill=ACCENT_FILL if highlight else WHITE,
        edge=ACCENT if highlight else BORDER,
        lw=1.3 if highlight else 0.9)
    colour = ACCENT if highlight else INK
    line(cx, iy + 0.61, t1, 8.5, "bold", colour)
    line(cx, iy + 0.455, t2, 8.5, "bold", colour)
    line(cx, iy + 0.16, sub, 8, color=MUTED)

# ---- Row 4: data and external services ---------------------------------
y, h = 0.08, 0.82
dw = (R - L - 2 * 0.2) / 3
stores = [
    ("Database", "PostgreSQL (Neon)", "users, menu, orders, ratings", "SQL", False),
    ("Dish photos", "Cloudinary", "image storage", "image upload", False),
    ("AI chat service", "external LLM API", "optional", "HTTPS", True),
]
for i, (title, l1, l2, label, optional) in enumerate(stores):
    dx = L + i * (dw + 0.2)
    cx = dx + dw / 2
    box(dx, y, dw, h, fill=WHITE, dashed=optional)
    line(cx, y + 0.58, title, 9, "bold")
    line(cx, y + 0.36, l1, 8)
    line(cx, y + 0.15, l2, 8, color=MUTED)
    arrow(cx, back_bottom, y + h, dashed=optional)
    arrow_label(cx + 0.1, (back_bottom + y + h) / 2, label)
tier_label(y + h / 2, "DATA AND\nEXTERNAL\nSERVICES")

OUT.parent.mkdir(parents=True, exist_ok=True)
fig.savefig(OUT, dpi=300, facecolor="white")
print("saved", OUT)
