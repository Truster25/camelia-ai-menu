#!/usr/bin/env python3
"""
Builds the "Programming languages and tools" report for the Camelia project.

Audience: the project supervisor (a lecturer). She asked the student to send a
written account of the programming languages used, for inclusion in the project
paper. The document therefore states the languages, says exactly where each one
belongs in the paper, and gives ready-to-use wording she can quote or adapt.

All versions and counts are read from the actual repository, not invented.
"""
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_BREAK
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

# --------------------------------------------------------------------------- #
# Palette — matches the report's quiet, academic look
# --------------------------------------------------------------------------- #
INK = RGBColor(0x1F, 0x22, 0x1B)
MUTED = RGBColor(0x5A, 0x5F, 0x54)
ACCENT = RGBColor(0x8A, 0x5A, 0x2B)
RULE = "D8D3C6"
BAND = "F1EDE3"

OUT = "/home/user/camelia-ai-menu/MP3/camelia-project/docs/Programming-Languages-and-Tools.docx"


# --------------------------------------------------------------------------- #
# Small helpers
# --------------------------------------------------------------------------- #
def shade(cell, hex_fill):
    el = OxmlElement("w:shd")
    el.set(qn("w:val"), "clear")
    el.set(qn("w:color"), "auto")
    el.set(qn("w:fill"), hex_fill)
    cell._tc.get_or_add_tcPr().append(el)


def cell_margins(table, top=80, bottom=80, left=110, right=110):
    tblPr = table._tbl.tblPr
    mar = OxmlElement("w:tblCellMar")
    for side, val in (("top", top), ("left", left), ("bottom", bottom), ("right", right)):
        node = OxmlElement(f"w:{side}")
        node.set(qn("w:w"), str(val))
        node.set(qn("w:type"), "dxa")
        mar.append(node)
    tblPr.append(mar)


def bottom_rule(paragraph, color=RULE, size=6):
    pPr = paragraph._p.get_or_add_pPr()
    borders = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    bottom.set(qn("w:val"), "single")
    bottom.set(qn("w:sz"), str(size))
    bottom.set(qn("w:space"), "4")
    bottom.set(qn("w:color"), color)
    borders.append(bottom)
    pPr.append(borders)


def keep_with_next(paragraph):
    paragraph.paragraph_format.keep_with_next = True


def h1(doc, text, page_break=False):
    if page_break:
        doc.add_page_break()
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(20)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text.upper())
    run.font.size = Pt(13)
    run.font.bold = True
    run.font.color.rgb = INK
    run.font.name = "Calibri"
    bottom_rule(p, "8A5A2B", 8)
    return p


def h2(doc, text):
    p = doc.add_paragraph()
    p.paragraph_format.space_before = Pt(13)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.keep_with_next = True
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    run.font.bold = True
    run.font.color.rgb = ACCENT
    return p


def body(doc, text, space_after=7, italic=False, size=10.5):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    p.paragraph_format.line_spacing = 1.25
    run = p.add_run(text)
    run.font.size = Pt(size)
    run.font.italic = italic
    run.font.color.rgb = INK
    return p


def bullet(doc, text, bold_lead=None):
    p = doc.add_paragraph(style="List Bullet")
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.2
    if bold_lead:
        lead = p.add_run(bold_lead)
        lead.font.bold = True
        lead.font.size = Pt(10.5)
        lead.font.color.rgb = INK
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    run.font.color.rgb = INK
    return p


def numbered(doc, text):
    p = doc.add_paragraph(style="List Number")
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.2
    run = p.add_run(text)
    run.font.size = Pt(10.5)
    run.font.color.rgb = INK
    return p


def table(doc, headers, rows, widths=None, font_size=9.5, zebra=True):
    t = doc.add_table(rows=1, cols=len(headers))
    t.style = "Table Grid"
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    cell_margins(t)

    hdr = t.rows[0].cells
    for i, text in enumerate(headers):
        shade(hdr[i], BAND)
        para = hdr[i].paragraphs[0]
        para.paragraph_format.space_after = Pt(0)
        run = para.add_run(text)
        run.font.bold = True
        run.font.size = Pt(font_size)
        run.font.color.rgb = INK

    for r_idx, row in enumerate(rows):
        cells = t.add_row().cells
        for c_idx, text in enumerate(row):
            if zebra and r_idx % 2 == 1:
                shade(cells[c_idx], "FAF8F3")
            para = cells[c_idx].paragraphs[0]
            para.paragraph_format.space_after = Pt(0)
            para.paragraph_format.line_spacing = 1.15
            run = para.add_run(str(text))
            run.font.size = Pt(font_size)
            run.font.color.rgb = INK

    if widths:
        for row in t.rows:
            for i, w in enumerate(widths):
                row.cells[i].width = Cm(w)
    return t


def callout(doc, title, text):
    t = doc.add_table(rows=1, cols=1)
    t.alignment = WD_TABLE_ALIGNMENT.CENTER
    cell = t.rows[0].cells[0]
    shade(cell, BAND)
    cell_margins(t, top=140, bottom=140, left=170, right=170)
    para = cell.paragraphs[0]
    para.paragraph_format.space_after = Pt(3)
    run = para.add_run(title)
    run.font.bold = True
    run.font.size = Pt(10)
    run.font.color.rgb = ACCENT
    para2 = cell.add_paragraph()
    para2.paragraph_format.space_after = Pt(0)
    para2.paragraph_format.line_spacing = 1.2
    run2 = para2.add_run(text)
    run2.font.size = Pt(9.5)
    run2.font.color.rgb = INK
    doc.add_paragraph().paragraph_format.space_after = Pt(2)
    return t


# --------------------------------------------------------------------------- #
# Build the document
# --------------------------------------------------------------------------- #
doc = Document()

# base style
normal = doc.styles["Normal"]
normal.font.name = "Calibri"
normal.font.size = Pt(10.5)
normal.font.color.rgb = INK

section = doc.sections[0]
section.top_margin = Cm(2.2)
section.bottom_margin = Cm(2.2)
section.left_margin = Cm(2.4)
section.right_margin = Cm(2.4)

# ---------------- cover block ----------------
p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(2)
r = p.add_run("CAMELIA RESTAURANT · AI-BASED MENU RECOMMENDATION SYSTEM")
r.font.size = Pt(8.5)
r.font.bold = True
r.font.color.rgb = ACCENT
r.font.all_caps = True

p = doc.add_paragraph()
p.paragraph_format.space_after = Pt(4)
r = p.add_run("Programming Languages and Development Tools Used")
r.font.size = Pt(22)
r.font.bold = True
r.font.color.rgb = INK

p = doc.add_paragraph()
bottom_rule(p, "8A5A2B", 10)
r = p.add_run(
    "A technical note prepared for the supervisor, stating the languages used to build the system, "
    "the role of each one, and the chapters of the project paper in which they should be described."
)
r.font.size = Pt(10.5)
r.font.color.rgb = MUTED

p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(6)
r = p.add_run("Prepared by:  ")
r.font.size = Pt(9)
r.font.color.rgb = MUTED
r = p.add_run("the student (author of the project paper)")
r.font.size = Pt(9)
r.font.color.rgb = INK
r = p.add_run("        Date:  ")
r.font.size = Pt(9)
r.font.color.rgb = MUTED
r = p.add_run("11 November 2026")
r.font.size = Pt(9)
r.font.color.rgb = INK

# ---------------- 1. the short answer ----------------
h1(doc, "1.  The short answer")

body(
    doc,
    "The system is written in two programming languages. The part the customer and the manager see "
    "is written in TypeScript, which is JavaScript with type-checking added. The part that holds the "
    "data, serves the request and runs the recommendation is written in Python. Everything else is a "
    "supporting tool rather than a programming language: a database, a styling framework and libraries.",
)

callout(
    doc,
    "In one sentence, for the paper",
    "The system was implemented in TypeScript (JavaScript) on the client side and Python on the server "
    "side, with PostgreSQL as the database, giving a clear separation between the presentation layer and "
    "the application and intelligence layer.",
)

body(
    doc,
    "Both languages were chosen deliberately. TypeScript is the language the React framework is written "
    "for, and it catches mistakes while the screens are being built. Python is the language of the "
    "machine-learning libraries, so the recommender and the web server can live in one program and be "
    "tested with the same tools.",
)

# ---------------- 2. language table ----------------
h1(doc, "2.  Languages used, and what each one does")

table(
    doc,
    ["Language", "Where it is used", "What it is responsible for"],
    [
        [
            "TypeScript\n(JavaScript with types)",
            "Client side — every screen in the browser",
            "All nine pages of the website, the preference quiz, the shopping basket, the manager "
            "dashboard and the sign-in screens. Compiled to JavaScript, which is the only language a "
            "browser can run.",
        ],
        [
            "Python",
            "Server side — the application and the recommender",
            "Receives requests from the browser, applies the business rules, computes the recommendation "
            "score, reads and writes the database, and checks passwords and permissions.",
        ],
        [
            "SQL",
            "Database",
            "The table definitions and the queries behind them. Written through SQLAlchemy rather than "
            "by hand, so the same code runs on SQLite during development and PostgreSQL in production.",
        ],
        [
            "CSS",
            "Client side — appearance",
            "Layout, colour, typography and animation. Written through Tailwind CSS utility classes "
            "rather than as separate stylesheets.",
        ],
    ],
    widths=[3.6, 4.6, 7.8],
)

body(
    doc,
    "CSS is included for completeness. It is a style-sheet language rather than a programming language, "
    "and the paper should say so if it is mentioned, since markers sometimes ask.",
    italic=True,
    size=9.5,
)

# ---------------- 3. why these languages ----------------
h1(doc, "3.  Why these languages were chosen")

h2(doc, "3.1  Why TypeScript on the client side")
bullet(doc, "It is the language React is designed for, so the screens use the framework the way it is meant to be used.", "Fit with the framework.  ")
bullet(doc, "A misspelt field or a wrong data type is reported while the code is being written, instead of appearing as a blank screen during the demonstration.", "Fewer faults reach the user.  ")
bullet(doc, "It compiles to plain JavaScript, so it runs in every modern browser with no installer for the customer.", "Nothing to install.  ")
bullet(doc, "The same code base serves a phone, a tablet and a laptop screen, which matters for a restaurant where customers are seated.", "One code base, every screen size.  ")

h2(doc, "3.2  Why Python on the server side")
bullet(doc, "The recommender needs a text-similarity model and a ranking formula. Those live in Python libraries, so the model and the web server run in the same language and the same process.", "The intelligence and the server share one language.  ")
bullet(doc, "The whole recommendation method can be read, changed and tested in one file, which is what makes it defensible in Chapter 5 of the paper.", "The method stays explainable.  ")
bullet(doc, "Python is the language taught for data handling and machine learning, so the code can be explained to a marker who does not specialise in web development.", "It can be explained.  ")

h2(doc, "3.3  Why two languages rather than one")
body(
    doc,
    "A single language was possible, but a poor fit. Writing the browser interface in Python would have "
    "meant a slower, less responsive page. Writing the recommender in JavaScript would have meant "
    "re-implementing numerical libraries by hand. Splitting the system also gives the architecture "
    "diagram in Chapter 5 a genuine reason to exist: the two halves talk to each other over a defined "
    "web interface, so each can be replaced without rewriting the other.",
)

# ---------------- 4. where it goes in the paper ----------------
doc.add_page_break()
h1(doc, "4.  Where each language belongs in the paper")

body(
    doc,
    "The languages are not described all in one place. They appear three times, and each appearance has "
    "a different purpose. This is the part to agree with the supervisor before writing.",
)

table(
    doc,
    ["Chapter", "Section of the guidelines", "What is said about the languages there"],
    [
        [
            "Chapter 1 — Introduction",
            "1.9 Justification of the study / scope",
            "One or two sentences only: the system is a web application built with TypeScript and "
            "Python. No detail; the chapter is about the problem, not the tools.",
        ],
        [
            "Chapter 3 — Methodology",
            "3.6 / 3.7 Development tools",
            "The list of languages and tools in a table with a reason for each choice — this is where "
            "the table in section 2 of this note is placed. Written in the past tense, as a decision "
            "already taken.",
        ],
        [
            "Chapter 5 — System design",
            "5.x Architecture design",
            "The languages shown on the architecture diagram as the two tiers of the system, with the "
            "separation between client and server explained.",
        ],
        [
            "Chapter 6 — System implementation",
            "6.2 Tools used for coding and testing",
            "The authoritative statement: exact language versions, the editor used, the libraries with "
            "version numbers, and code extracts. This is the chapter the supervisor is asking about.",
        ],
        [
            "Appendix",
            "5.16 / appendix",
            "The full list of libraries with version numbers, as a reference table. Keeps Chapter 6 "
            "readable.",
        ],
    ],
    widths=[4.2, 4.0, 7.8],
)

callout(
    doc,
    "If only one chapter can be changed now",
    "Put it in Chapter 6, section 6.2, \"Tools used for coding and testing\". The guidelines expect that "
    "section to name the languages and tools with version numbers, and it is the section a marker turns "
    "to when checking that the system was really built. A short cross-reference in Chapter 3 then points "
    "back to it, so the same paragraph is not written twice.",
)

# ---------------- 5. ready-to-use wording ----------------
h1(doc, "5.  Ready-to-use wording for the paper")

body(
    doc,
    "The paragraphs below are written in the past tense and in plain academic English, matching the "
    "department's requirement. They are a starting point to be edited into the student's own voice — "
    "the guidelines require the words to be her own, so they should not be pasted unchanged.",
    italic=True,
    size=9.5,
)

h2(doc, "5.1  For Chapter 3 (Methodology) — development tools")
body(
    doc,
    "The system was developed as a two-tier web application. The client side was implemented in "
    "TypeScript 5.6, a superset of JavaScript that adds static typing, and was built with React 18 and "
    "Vite 5. Styling was written with Tailwind CSS. The server side was implemented in Python 3.11 using "
    "the FastAPI framework, with SQLAlchemy for database access and scikit-learn for the recommendation "
    "model. PostgreSQL was used as the database management system in production, with SQLite used for "
    "local development. The choice of TypeScript on the client and Python on the server allowed the user "
    "interface and the recommendation logic to be developed, tested and modified independently of each "
    "other.",
)

h2(doc, "5.2  For Chapter 6 (Implementation) — languages and versions")
body(
    doc,
    "The implementation used two programming languages. TypeScript was used for all client-side code, "
    "compiled to JavaScript by Vite before being served to the browser. Python was used for all "
    "server-side code, including the recommendation engine. The version of each language and library is "
    "given in Table 6.x. TypeScript was selected because its type-checking identifies inconsistencies "
    "between the data returned by the server and the data displayed on screen before the application is "
    "run. Python was selected because the machine-learning libraries required by the recommendation "
    "algorithm are written in Python, allowing the web server and the recommendation model to run within "
    "a single application.",
)

h2(doc, "5.3  For Chapter 5 (Design) — architecture sentence")
body(
    doc,
    "The system follows a client–server architecture. The presentation tier is implemented in TypeScript "
    "and runs in the user's browser; the application tier is implemented in Python and runs on the "
    "server, exposing a documented web interface that the presentation tier calls. The data tier is a "
    "PostgreSQL relational database. This separation means the recommendation model can be changed "
    "without altering any screen, and a screen can be redesigned without touching the model.",
)

# ---------------- 6. versions ----------------
doc.add_page_break()
h1(doc, "6.  Exact versions, for the tools table in Chapter 6")

body(
    doc,
    "These are the versions the system actually runs on, read from the project's dependency files. They "
    "can be copied into the table the guidelines require in Chapter 6.",
)

h2(doc, "6.1  Languages and runtimes")
table(
    doc,
    ["Item", "Version", "Note"],
    [
        ["TypeScript", "5.6.3", "Client-side language"],
        ["JavaScript (ECMAScript)", "ES2022", "Target the TypeScript is compiled to"],
        ["Python", "3.11.2", "Server-side language"],
        ["SQL", "PostgreSQL 16 / SQLite 3", "Written through SQLAlchemy, not by hand"],
        ["Node.js", "22.x", "Runtime that builds the client (development only)"],
    ],
    widths=[4.6, 4.4, 7.0],
)

h2(doc, "6.2  Client-side libraries")
table(
    doc,
    ["Library", "Version", "Purpose"],
    [
        ["React", "18.3.1", "User-interface framework"],
        ["React Router", "6.30.6", "Navigation between the nine pages"],
        ["Vite", "5.4.11", "Build tool and development server"],
        ["Tailwind CSS", "4.3.5", "Styling, layout and responsive design"],
        ["Lucide React", "0.468.0", "Icon set"],
        ["Playfair Display / Inter", "5.3.0", "Typefaces, self-hosted"],
    ],
    widths=[4.6, 3.0, 8.4],
)

h2(doc, "6.3  Server-side libraries")
table(
    doc,
    ["Library", "Version", "Purpose"],
    [
        ["FastAPI", "0.115.12", "Web framework that exposes the server interface"],
        ["Uvicorn", "0.34.2", "Application server that runs FastAPI"],
        ["SQLAlchemy", "2.0.57", "Database toolkit and object-relational mapping"],
        ["scikit-learn", "1.9.1", "Text similarity and the recommendation model"],
        ["NumPy", "2.4.6", "Numerical operations behind the model"],
        ["Pydantic", "2.14.3", "Validation of data entering and leaving the server"],
        ["python-jose", "3.5.0", "JSON Web Tokens for sign-in sessions"],
        ["bcrypt", "4.0.1", "Password hashing"],
        ["psycopg2", "2.9.x", "PostgreSQL driver used in production"],
        ["pytest", "8.3.5", "Automated testing of the server"],
        ["HTTPX", "0.28.1", "Test client for the server"],
    ],
    widths=[4.6, 3.0, 8.4],
)

h2(doc, "6.4  Size of the implementation")
table(
    doc,
    ["Measure", "Value"],
    [
        ["Pages / screens implemented", "9 (home, menu, dish detail, quiz, how it works, basket, orders, sign-in, manager dashboard)"],
        ["Client-side source files", "TypeScript and TSX, approximately 4,000 lines"],
        ["Server-side source files", "18 Python modules, approximately 2,250 lines"],
        ["Server interface groups", "6 (authentication, menu, orders, ratings, recommendations, administration)"],
        ["Dishes in the seeded menu", "26 across 6 categories"],
        ["Automated server tests", "33"],
        ["Database tables", "8"],
    ],
    widths=[6.0, 10.0],
)

# ---------------- 7. what to ask the supervisor ----------------
h1(doc, "7.  Points to confirm with the supervisor")

body(doc, "Four questions are worth settling before the chapter is written.", space_after=5)
numbered(
    doc,
    "Which chapter should carry the full description — Chapter 3, section 3.7 (development tools), or "
    "Chapter 6, section 6.2 (tools used for coding and testing)? The recommendation in this note is "
    "Chapter 6, with a one-line cross-reference in Chapter 3.",
)
numbered(
    doc,
    "Should CSS and SQL be listed as programming languages, or named separately as a style-sheet "
    "language and a query language? Listing them without comment is the usual cause of a lost mark.",
)
numbered(
    doc,
    "Does the department want version numbers in the body text or only in a table? The guidelines "
    "mention version numbers for Chapter 6, but not the format.",
)
numbered(
    doc,
    "Should the libraries be listed in full in Chapter 6, or moved to an appendix with only the main "
    "ones named in the chapter? A table of eleven libraries can take most of a page that the chapter "
    "limit does not allow.",
)

# ---------------- 8. how to state it on the title page / abstract ----------------
h1(doc, "8.  One-line description for the abstract")

body(
    doc,
    "If the abstract needs to name the technology in a single clause, this is accurate and short enough "
    "to fit:",
    space_after=6,
)
callout(
    doc,
    "Suggested clause",
    "\u201c…implemented as a web application using TypeScript and React on the client side and Python with "
    "FastAPI on the server side, with a hybrid content-based recommendation model built with scikit-learn "
    "and a PostgreSQL database.\u201d",
)

# ---------------- footer note ----------------
p = doc.add_paragraph()
p.paragraph_format.space_before = Pt(14)
bottom_rule(p, RULE, 4)
r = p.add_run(
    "Prepared from the system as built. Versions were read from the project's dependency files "
    "(package.json and requirements.txt) on 11 November 2026 and will not change unless a library is "
    "updated, in which case this table should be refreshed before submission."
)
r.font.size = Pt(8.5)
r.font.italic = True
r.font.color.rgb = MUTED

doc.save(OUT)
print("written:", OUT)
