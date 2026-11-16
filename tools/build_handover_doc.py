"""Builds the build-to-book handover document (Word .docx).

Run:  python3 tools/make_architecture_diagram.py   (once, or after changing the figure)
      python3 tools/build_handover_doc.py
Out:  Handover-Document-v0.1.docx

All wording lives in the CONTENT section near the bottom, so later versions
only need those blocks edited. Needs python-docx.
"""
from pathlib import Path

from docx import Document
from docx.enum.table import WD_CELL_VERTICAL_ALIGNMENT, WD_TABLE_ALIGNMENT
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_LINE_SPACING, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn
from docx.shared import Cm, Pt, RGBColor

ROOT = Path(__file__).resolve().parent.parent
FIGURE = ROOT / "figures" / "architecture.png"
VERSION = "0.1"
DATE = "11 November 2026"
OUT = ROOT / f"Handover-Document-v{VERSION}.docx"

FONT = "Arial"
INK = "1F2933"
MUTED = "52606D"
ACCENT = "1E6B52"
ACCENT_FILL = "E3F1EA"
SOFT_FILL = "F4F6F8"
RULE = "C5CDD5"
RULE_STRONG = "8A96A3"

PAGE_W, MARGIN_X = 21.0, 2.2
TEXT_W = PAGE_W - 2 * MARGIN_X          # 16.6 cm

# Child order required by the WordprocessingML schema (Word is strict about it).
PPR_ORDER = ["pStyle", "keepNext", "keepLines", "pageBreakBefore", "framePr", "widowControl",
             "numPr", "suppressLineNumbers", "pBdr", "shd", "tabs", "suppressAutoHyphens",
             "kinsoku", "wordWrap", "overflowPunct", "topLinePunct", "autoSpaceDE",
             "autoSpaceDN", "bidi", "adjustRightInd", "snapToGrid", "spacing", "ind",
             "contextualSpacing", "mirrorIndents", "suppressOverlap", "jc", "textDirection",
             "textAlignment", "textboxTightWrap", "outlineLvl", "divId", "cnfStyle", "rPr",
             "sectPr", "pPrChange"]
TCPR_ORDER = ["cnfStyle", "tcW", "gridSpan", "hMerge", "vMerge", "tcBorders", "shd", "noWrap",
              "tcMar", "textDirection", "tcFitText", "vAlign", "hideMark"]


def insert_ordered(parent, child, order):
    """Insert child into parent at the position the schema order requires."""
    name = child.tag.split("}")[1]
    later = {qn(f"w:{t}") for t in order[order.index(name) + 1:]}
    for existing in parent:
        if existing.tag in later:
            existing.addprevious(child)
            return child
    parent.append(child)
    return child


def twips(cm):
    return int(round(cm / 2.54 * 1440))


# ---------------------------------------------------------------- styles

def set_style_font(style, size=None, bold=None, italic=None, color=None):
    rpr = style.element.get_or_add_rPr()
    rfonts = rpr.find(qn("w:rFonts"))
    if rfonts is None:
        rfonts = OxmlElement("w:rFonts")
        rpr.insert(0, rfonts)
    for attr in list(rfonts.attrib):
        del rfonts.attrib[attr]                 # drops theme fonts that would override
    for attr in ("ascii", "hAnsi", "cs", "eastAsia"):
        rfonts.set(qn(f"w:{attr}"), FONT)
    font = style.font
    if size is not None:
        font.size = Pt(size)
    if bold is not None:
        font.bold = bold
    if italic is not None:
        font.italic = italic
    if color is not None:
        font.color.rgb = RGBColor.from_string(color)


def set_spacing(style, before=0, after=0, line=None, keep_next=None):
    pf = style.paragraph_format
    pf.space_before = Pt(before)
    pf.space_after = Pt(after)
    if line is not None:
        pf.line_spacing_rule = WD_LINE_SPACING.MULTIPLE
        pf.line_spacing = line
    if keep_next is not None:
        pf.keep_with_next = keep_next


def setup_styles(doc):
    styles = doc.styles
    lang = styles.element.find(qn("w:docDefaults")).find(f".//{qn('w:lang')}")
    if lang is not None:
        lang.set(qn("w:val"), "en-GB")

    normal = styles["Normal"]
    set_style_font(normal, size=10.5, color=INK)
    set_spacing(normal, after=6, line=1.2)

    title = styles["Title"]
    ppr = title.element.pPr
    for tag in ("w:pBdr", "w:contextualSpacing"):
        el = ppr.find(qn(tag))
        if el is not None:
            ppr.remove(el)
    rpr = title.element.rPr
    for tag in ("w:spacing", "w:kern"):
        el = rpr.find(qn(tag))
        if el is not None:
            rpr.remove(el)
    set_style_font(title, size=22, bold=True, color=INK)
    set_spacing(title, after=2, line=1.05)

    subtitle = styles["Subtitle"]
    ppr = subtitle.element.pPr
    el = ppr.find(qn("w:numPr"))
    if el is not None:
        ppr.remove(el)
    el = subtitle.element.rPr.find(qn("w:spacing"))
    if el is not None:
        subtitle.element.rPr.remove(el)
    set_style_font(subtitle, size=13, bold=False, italic=False, color=ACCENT)
    set_spacing(subtitle, after=8, line=1.1)

    h1 = styles["Heading 1"]
    set_style_font(h1, size=14, bold=True, color=ACCENT)
    set_spacing(h1, before=18, after=6, line=1.1, keep_next=True)

    caption = styles["Caption"]
    set_style_font(caption, size=9, bold=False, italic=True, color=MUTED)
    set_spacing(caption, before=4, after=10, line=1.1)
    caption.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.CENTER

    for name, size, bold, color in (("Table Text", 9.5, False, INK), ("Table Head", 9.5, True, INK)):
        st = styles.add_style(name, 1)       # 1 = paragraph style
        st.base_style = normal
        set_style_font(st, size=size, bold=bold, color=color)
        set_spacing(st, after=0, line=1.15)

    body_list = styles.add_style("Body List", 1)
    body_list.base_style = normal
    set_style_font(body_list)
    set_spacing(body_list, after=3, line=1.2)

    meta = styles.add_style("Meta Line", 1)
    meta.base_style = normal
    set_style_font(meta, size=9.5, color=MUTED)
    set_spacing(meta, after=10, line=1.1)


# ---------------------------------------------------------------- lists

class Lists:
    """Own bullet and number definitions, so lists look the same in every viewer."""

    BULLET_ABS, NUMBER_ABS = 90, 91

    def __init__(self, doc):
        self.numbering = doc.part.numbering_part.numbering_definitions._numbering
        first_num = self.numbering.find(qn("w:num"))
        for abs_id, fmt, lvl_text, hanging, extra in (
            (self.BULLET_ABS, "bullet", "\u2022", 280,
             f'<w:rPr><w:rFonts w:ascii="{FONT}" w:hAnsi="{FONT}" w:cs="{FONT}" w:hint="default"/>'
             f'<w:color w:val="{ACCENT}"/></w:rPr>'),
            (self.NUMBER_ABS, "decimal", "%1.", 360,
             f'<w:rPr><w:b/><w:color w:val="{ACCENT}"/></w:rPr>'),
        ):
            xml = (
                f'<w:abstractNum {nsdecls("w")} w:abstractNumId="{abs_id}">'
                f'<w:multiLevelType w:val="hybridMultilevel"/>'
                f'<w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="{fmt}"/>'
                f'<w:lvlText w:val="{lvl_text}"/><w:lvlJc w:val="left"/>'
                f'<w:pPr><w:ind w:left="{hanging + 200}" w:hanging="{hanging}"/></w:pPr>'
                f'{extra}</w:lvl></w:abstractNum>'
            )
            first_num.addprevious(parse_xml(xml))     # abstractNum must precede every num
        self.bullet_id = self._new_num(self.BULLET_ABS)

    def _new_num(self, abs_id, restart=False):
        num = self.numbering.add_num(abs_id)
        if restart:
            num.add_lvlOverride(ilvl=0).add_startOverride(1)
        return num.numId

    def new_numbered(self):
        return self._new_num(self.NUMBER_ABS, restart=True)


# ---------------------------------------------------------------- text helpers

def add_runs(paragraph, text):
    """Adds text to a paragraph; **double asterisks** mark bold."""
    for i, chunk in enumerate(text.split("**")):
        if chunk:
            run = paragraph.add_run(chunk)
            if i % 2:
                run.bold = True
    return paragraph


def para(doc, text, style=None, keep_next=False, after=None):
    p = doc.add_paragraph(style=style)
    add_runs(p, text)
    if keep_next:
        p.paragraph_format.keep_with_next = True
    if after is not None:
        p.paragraph_format.space_after = Pt(after)
    return p


def list_items(doc, items, num_id, last_after=8):
    for i, item in enumerate(items):
        p = doc.add_paragraph(style="Body List")
        add_runs(p, item)
        num_pr = p._p.get_or_add_pPr().get_or_add_numPr()
        num_pr.get_or_add_ilvl().val = 0
        num_pr.get_or_add_numId().val = num_id
        if i == len(items) - 1:
            p.paragraph_format.space_after = Pt(last_after)
        else:
            p.paragraph_format.keep_with_next = True    # a list is not split across pages


def bottom_rule(paragraph, color=ACCENT, size=8, space=6):
    pbdr = OxmlElement("w:pBdr")
    bottom = OxmlElement("w:bottom")
    for k, v in (("val", "single"), ("sz", str(size)), ("space", str(space)), ("color", color)):
        bottom.set(qn(f"w:{k}"), v)
    pbdr.append(bottom)
    insert_ordered(paragraph._p.get_or_add_pPr(), pbdr, PPR_ORDER)


# ---------------------------------------------------------------- tables

def border(tag, val="single", size=4, color=RULE):
    el = OxmlElement(f"w:{tag}")
    for k, v in (("val", val), ("sz", str(size)), ("space", "0"), ("color", color)):
        el.set(qn(f"w:{k}"), v)
    return el


def reset_table_properties(table, widths_cm, borders, margins=(0.12, 0.2)):
    """Rebuilds tblPr in schema order: tblW, jc, tblBorders, tblLayout, tblCellMar, tblLook."""
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    for child in list(tbl_pr):
        tbl_pr.remove(child)

    tbl_w = OxmlElement("w:tblW")
    tbl_w.set(qn("w:w"), str(sum(twips(w) for w in widths_cm)))
    tbl_w.set(qn("w:type"), "dxa")
    jc = OxmlElement("w:jc")
    jc.set(qn("w:val"), "center")
    tbl_borders = OxmlElement("w:tblBorders")
    for b in borders:
        tbl_borders.append(b)
    layout = OxmlElement("w:tblLayout")
    layout.set(qn("w:type"), "fixed")
    cell_mar = OxmlElement("w:tblCellMar")
    for side, cm in (("top", margins[0]), ("left", margins[1]), ("bottom", margins[0]), ("right", margins[1])):
        m = OxmlElement(f"w:{side}")
        m.set(qn("w:w"), str(twips(cm)))
        m.set(qn("w:type"), "dxa")
        cell_mar.append(m)
    look = OxmlElement("w:tblLook")
    look.set(qn("w:val"), "04A0")
    for el in (tbl_w, jc, tbl_borders, layout, cell_mar, look):
        tbl_pr.append(el)

    grid = tbl.tblGrid
    for col, w in zip(grid.findall(qn("w:gridCol")), widths_cm):
        col.set(qn("w:w"), str(twips(w)))
    for row in table.rows:
        for cell, w in zip(row.cells, widths_cm):
            cell.width = Cm(w)


def shade(cell, fill):
    shd = OxmlElement("w:shd")
    shd.set(qn("w:val"), "clear")
    shd.set(qn("w:color"), "auto")
    shd.set(qn("w:fill"), fill)
    insert_ordered(cell._tc.get_or_add_tcPr(), shd, TCPR_ORDER)


def row_flags(row, header=False):
    tr_pr = row._tr.get_or_add_trPr()
    tr_pr.append(OxmlElement("w:cantSplit"))        # a row never breaks across pages
    if header:
        tr_pr.append(OxmlElement("w:tblHeader"))    # header repeats on a new page


def data_table(doc, headers, rows, widths_cm, bold_first=True, centre_cols=()):
    table = doc.add_table(rows=1 + len(rows), cols=len(headers))
    reset_table_properties(table, widths_cm, borders=[
        border("top", size=8, color=RULE_STRONG),
        border("left", val="nil"),
        border("bottom", size=8, color=RULE_STRONG),
        border("right", val="nil"),
        border("insideH", size=4, color=RULE),
        border("insideV", val="nil"),
    ])
    # A page break never leaves the header on its own, or a single row alone at the end.
    last = len(rows)
    keep_rows = {0, last - 1}
    for r, values in enumerate([headers] + rows):
        row = table.rows[r]
        row_flags(row, header=(r == 0))
        for c, value in enumerate(values):
            cell = row.cells[c]
            if r == 0:
                shade(cell, ACCENT_FILL)
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.TOP
            p = cell.paragraphs[0]
            p.style = "Table Head" if (r == 0 or (bold_first and c == 0)) else "Table Text"
            add_runs(p, value)
            if c in centre_cols:
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            if r in keep_rows:
                p.paragraph_format.keep_with_next = True
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(0)
    spacer.paragraph_format.line_spacing = Pt(8)
    return table


def callout(doc, text):
    table = doc.add_table(rows=1, cols=1)
    reset_table_properties(table, [TEXT_W], margins=(0.22, 0.35), borders=[
        border("top", val="nil"), border("left", size=24, color=ACCENT),
        border("bottom", val="nil"), border("right", val="nil"),
        border("insideH", val="nil"), border("insideV", val="nil"),
    ])
    cell = table.rows[0].cells[0]
    shade(cell, SOFT_FILL)
    p = cell.paragraphs[0]
    add_runs(p, text)
    p.paragraph_format.space_after = Pt(0)
    spacer = doc.add_paragraph()
    spacer.paragraph_format.space_after = Pt(0)
    spacer.paragraph_format.line_spacing = Pt(4)


# ---------------------------------------------------------------- page furniture

def add_field(paragraph, instruction):
    for kind, payload in (("begin", None), ("instr", instruction), ("separate", None),
                          ("text", "1"), ("end", None)):
        run = paragraph.add_run()
        if kind == "instr":
            el = OxmlElement("w:instrText")
            el.set(qn("xml:space"), "preserve")
            el.text = payload
            run._r.append(el)
        elif kind == "text":
            run.text = payload
        else:
            el = OxmlElement("w:fldChar")
            el.set(qn("w:fldCharType"), kind)
            run._r.append(el)


def setup_page(doc):
    section = doc.sections[0]
    section.page_width, section.page_height = Cm(PAGE_W), Cm(29.7)
    section.left_margin = section.right_margin = Cm(MARGIN_X)
    section.top_margin, section.bottom_margin = Cm(2.0), Cm(2.0)
    section.footer_distance = Cm(1.0)

    p = section.footer.paragraphs[0]
    p.style = doc.styles["Meta Line"]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(TEXT_W), WD_TAB_ALIGNMENT.RIGHT)
    p.add_run(f"AI-Based Menu Recommendation System  |  Handover document, version {VERSION}")
    p.add_run("\tPage ")
    add_field(p, "PAGE")
    p.add_run(" of ")
    add_field(p, "NUMPAGES")
    for run in p.runs:
        run.font.size = Pt(8.5)


# ================================================================ CONTENT

def build():
    doc = Document()
    setup_styles(doc)
    setup_page(doc)
    lists = Lists(doc)
    bullets = lists.bullet_id

    props = doc.core_properties
    props.title = "AI-Based Menu Recommendation System: build-to-book handover document"
    props.subject = "Case study: Camelia Restaurant"
    props.author = "Project developer"
    props.last_modified_by = "Project developer"
    props.comments = f"Version {VERSION}, {DATE}. Planning stage."
    props.language = "en-GB"

    # ---- title block
    doc.add_paragraph("AI-Based Menu Recommendation System", style="Title")
    doc.add_paragraph("Case study: Camelia Restaurant", style="Subtitle")
    meta = doc.add_paragraph(
        f"Build-to-book handover document  |  Version {VERSION}  |  {DATE}", style="Meta Line")
    bottom_rule(meta)
    callout(doc, "**Status: planning stage.** Nothing described here has been built yet. "
                 "Each section will be replaced with the real details as the system is built.")

    # ---- 1
    doc.add_heading("1. How to use this document", level=1)
    para(doc, "The project has two parts: the system, and the project paper (the book) that "
              "describes it. This document carries information from the first to the second. "
              "It follows the department\u2019s Undergraduate Project Paper Guidelines, so that "
              "each chapter of the paper has the facts, diagrams and tables it needs from the system.")
    para(doc, "It gives facts, not finished chapters. The student writes each chapter in her own "
              "words and in the past tense, as the guidelines require. References such as "
              "\u201csection 5.11\u201d point to the numbered sections of the guidelines.")

    # ---- 2
    doc.add_heading("2. Who provides what", level=1)
    para(doc, "The table follows the order of the paper. Page limits are those set in the guidelines.",
         keep_next=True)
    data_table(
        doc,
        ["Part of the paper", "Pages", "The student writes", "The developer provides"],
        [
            ["Preliminary pages", "not set",
             "Title page, declaration, dedication, acknowledgements, abstract, table of contents, "
             "lists of tables and figures",
             "Meanings of the technical abbreviations used (API, JWT, TF-IDF and others)"],
            ["Chapter 1: Introduction", "2\u20133",
             "Introduction, background of the restaurant, problem statement, objectives, justification",
             "What the system covers and leaves out; technical risks and how each is handled; "
             "hardware, software and hosting used, with costs; build tasks and their durations "
             "for the schedule"],
            ["Chapter 2: Literature review", "3\u20135",
             "The whole chapter",
             "Names of the methods the system uses (section 4 below), so that the review covers "
             "the right topics"],
            ["Chapter 3: Methodology", "4\u20135",
             "How facts were collected (interviews, questionnaire, observation, document review) "
             "and how the data was analysed",
             "The development model followed; tools used to build and test the system; time "
             "schedule and project cost"],
            ["Chapter 4: System analysis and requirement modelling", "8\u201310",
             "How the restaurant works today, with a flowchart; findings from the data collected",
             "Functional and non-functional requirements; use case diagram; data flow diagrams "
             "of the new system"],
            ["Chapter 5: System design", "7\u201310",
             "Explanation of each design",
             "Architecture diagram; database design at three levels (conceptual ER diagram, "
             "logical tables, physical data dictionary); flowchart of the recommendation "
             "process; screen designs"],
            ["Chapter 6: System implementation", "3\u20134",
             "Proposed change-over technique",
             "Tools used for coding and testing, with version numbers; system test plan; test "
             "cases with the test data and results; screenshots of the working system"],
            ["Chapter 7: Limitations, conclusions and recommendations", "1\u20132",
             "The whole chapter",
             "Technical limitations met during the build; improvements for the future"],
            ["References", "1\u20132",
             "Reference list in the Harvard system",
             "Official documentation of each tool, to cite"],
            ["Appendix", "10\u201320",
             "Organisational structure of the restaurant; questionnaire and interview guide; "
             "Gantt chart and network diagram showing the critical path",
             "Four pages of the most important code; technical guide; user manual"],
        ],
        widths_cm=[3.5, 1.5, 5.3, 6.3],
        centre_cols=(1,),
    )
    para(doc, "Three points follow from the guidelines:", keep_next=True, after=3)
    list_items(doc, [
        "**Chapters 4, 5 and 6 rest on the system.** Together they take 18 to 24 of the 28 to 39 "
        "chapter pages.",
        "**Page budget.** The chapter minimums add up to 28 pages and the maximums to 39, while "
        "the main document must have 35 to 50 pages (section 4.0). Every chapter therefore needs "
        "to be near its upper limit.",
        "**Code in the appendix.** Section 4.0 asks for at least four pages of code and section "
        "5.16 allows at most four, so the appendix carries exactly four.",
    ], bullets)

    # ---- 3
    doc.add_heading("3. What the system does", level=1)
    para(doc, "The system is a web application. Customers open it on their own phones by scanning "
              "a QR code or following a link; nothing is installed. The manager uses it from a "
              "laptop or tablet.")
    para(doc, "**The customer can:**", keep_next=True, after=3)
    list_items(doc, [
        "Browse the menu by category, with photos, prices and descriptions, and search or filter it",
        "Answer a short set of questions on diet, allergies, favourite kinds of food, spice level "
        "and budget",
        "See a \u201cRecommended for you\u201d list, where each dish shows the reason it was suggested",
        "See \u201cGoes well with\u201d suggestions beside each dish",
        "Rate dishes from one to five stars and save favourites",
        "Send a simple order with a table number (no payment)",
    ], bullets)
    para(doc, "**The restaurant manager can:**", keep_next=True, after=3)
    list_items(doc, [
        "Sign in to a protected management area",
        "Add, change and remove dishes, with category, price, photo, ingredients and dietary "
        "labels, and mark a dish as unavailable",
        "See incoming orders and customer ratings",
        "View a dashboard of the most ordered dishes, the best rated dishes and how often "
        "suggestions are accepted",
        "Retrain the recommendation model and see its accuracy measures",
    ], bullets)
    para(doc, "**Optional additions, only if time allows:**", keep_next=True, after=3)
    list_items(doc, [
        "A chat assistant: the customer describes what they feel like eating and receives "
        "suggestions from the menu",
        "Kinyarwanda and French versions of the screens",
        "A screen for waiters or the kitchen",
    ], bullets)
    para(doc, "**Not covered:** online or Mobile Money payment, delivery, stock control, a native "
              "Android or iOS app, and management of more than one branch. These belong in the "
              "scope and limitation section of Chapter 1.")
    para(doc, "This list is a proposal. It must agree with the objectives in the approved project "
              "proposal; where the two differ, the proposal is followed.")

    # ---- 4
    doc.add_heading("4. How the recommendation works", level=1)
    para(doc, "The system uses a hybrid recommender: several methods working together, so that "
              "each covers a weakness of the others. A request for suggestions passes through "
              "five steps.", keep_next=True)
    list_items(doc, [
        "**Rules first.** Dishes that are unavailable, that break the customer\u2019s diet or "
        "allergy limits, or that cost more than the budget are removed. These are fixed rules, "
        "not learned ones, because a mistake about an allergy is not acceptable.",
        "**Content-based filtering.** Every dish is described by its category, ingredients, taste "
        "and price band. The system compares these descriptions with the customer\u2019s taste "
        "profile, built from the questions answered and the dishes rated highly, and scores how "
        "well each dish matches. Techniques: TF-IDF vectors and cosine similarity.",
        "**Collaborative filtering.** The system looks at the ratings and orders of all customers "
        "and finds dishes that tend to be liked by the same people. Technique: item-based "
        "collaborative filtering.",
        "**Popularity and time of day.** The system counts what is ordered most at breakfast, "
        "lunch and dinner. This serves new customers who have no history yet, a difficulty the "
        "literature calls the cold-start problem.",
        "**Combined score.** The three scores are added with weights. A new customer is served "
        "mostly by steps 2 and 4; as ratings build up, step 3 gains weight. The highest-scoring "
        "dishes are shown, each with a short reason such as \u201cbecause you liked \u2026\u201d.",
    ], lists.new_numbered())
    para(doc, "\u201cGoes well with\u201d suggestions come from a separate method, association "
              "rules, which finds dishes that are often ordered together.")
    para(doc, "**Measuring quality.** Two checks are planned. In the first, part of the collected "
              "ratings is hidden from the model, and the model is tested on whether its top "
              "suggestions include dishes those customers really rated highly (measures: "
              "Precision@K and Recall@K). In the second, real customers and staff try the system "
              "and answer a short acceptance questionnaire. Both sets of results go into Chapter 6.")
    para(doc, "**Data the model learns from.** The restaurant\u2019s menu; ratings from the "
              "customer questionnaire; orders and ratings recorded once the system is in use. If "
              "there is too little real data, simulated data will be added for testing, and the "
              "paper will state clearly which results come from real data and which from "
              "simulated data.")
    para(doc, "**Topics for Chapter 2.** Recommender systems in general; content-based filtering; "
              "collaborative filtering; hybrid recommenders; the cold-start problem; association "
              "rule mining; how recommenders are evaluated; recommendation of food and restaurant "
              "menus; similar existing systems.")

    # ---- 5
    doc.add_heading("5. Architecture and hosting", level=1)
    para(doc, "Figure 1 shows the planned structure. It has three layers, a common arrangement "
              "for web systems.", keep_next=True)
    list_items(doc, [
        "**The presentation layer** is the part people see. It runs in the web browser of the "
        "customer\u2019s phone or the manager\u2019s laptop.",
        "**The application layer** is the server. It receives each request, checks who is asking "
        "and what they may do, reads and writes the records, and runs the recommendation engine.",
        "**The data layer** keeps the records in the database and the dish photos in an image store.",
    ], bullets)
    fig = doc.add_paragraph()
    fig.alignment = WD_ALIGN_PARAGRAPH.CENTER
    fig.paragraph_format.keep_with_next = True
    fig.paragraph_format.space_after = Pt(0)
    fig.paragraph_format.line_spacing = 1.0      # no extra leading around the picture
    shape = fig.add_run().add_picture(str(FIGURE), width=Cm(16.0))
    shape._inline.docPr.set("descr", (
        "Layered diagram. Customers on phones and the restaurant manager on a laptop reach the "
        "frontend web application over HTTPS. The frontend calls the backend application server "
        "through a REST API. The backend contains four parts: accounts and roles; menu, orders "
        "and ratings; the recommendation engine; reports and dashboard. The backend uses a "
        "PostgreSQL database, an image store for dish photos and, optionally, an external AI "
        "chat service."))
    doc.add_paragraph("Figure 1: Planned system architecture", style="Caption")
    para(doc, "**Hosting.** The screens will be hosted on Vercel, the server on Render, the "
              "database on Neon and the photos on Cloudinary. Each offered a free plan when this "
              "document was written. A complete copy will also run on a laptop without the "
              "internet, as a safeguard for the system demonstration; the same copy serves as the "
              "softcopy of the system that must be submitted (section 8.0).")

    # ---- 6
    doc.add_heading("6. Technology stack", level=1)
    para(doc, "These are the planned tools. Exact version numbers will be added once each tool is "
              "installed, for use in Chapters 3 and 6.", keep_next=True)
    data_table(
        doc,
        ["Layer", "Tool", "Reason for the choice"],
        [
            ["Screens (frontend)", "React with TypeScript, built with Vite",
             "Widely used and well documented; gives a fast single-page web application"],
            ["Appearance and charts", "Tailwind CSS with shadcn/ui components; Recharts for charts",
             "Consistent, professional screens on phones and laptops; dashboard charts"],
            ["Server (backend)", "Python with FastAPI",
             "The same language as the machine-learning libraries, so one server handles both; "
             "produces its own API documentation"],
            ["Recommendation engine", "pandas and scikit-learn",
             "Free, standard machine-learning libraries; every method used can be explained and tested"],
            ["Database", "PostgreSQL, with the SQLAlchemy and Alembic libraries",
             "A relational database, which suits the ER diagram and table designs required in Chapter 5"],
            ["Sign-in and access", "Hashed passwords, JSON Web Tokens (JWT) and user roles",
             "Customers and the manager see only what their role allows"],
            ["Testing", "pytest for the server; Vitest for the screens",
             "Provide the test cases and results for Chapter 6"],
            ["Source code", "Git and GitHub",
             "Keeps the history of the work and supplies the softcopy of the system"],
            ["Diagrams", "draw.io (diagrams.net)",
             "Flowcharts, data flow, use case and ER diagrams"],
            ["Hosting", "Vercel, Render, Neon and Cloudinary",
             "Free plans at the time of writing; described in section 5"],
        ],
        widths_cm=[3.5, 5.3, 7.8],
    )

    # ---- 7
    doc.add_heading("7. What the build needs from the student", level=1)
    para(doc, "The work also flows the other way. The system cannot be built without information "
              "from the restaurant, and the same information is the raw material for Chapters 1, "
              "3 and 4. Items 1 to 4 are needed before building starts.", keep_next=True)
    data_table(
        doc,
        ["No.", "What is needed", "What it is used for"],
        [
            ["1", "The approved project proposal, with its objectives and scope, and the "
                  "submission deadline",
             "Keeping the system and the paper in agreement; dates for section 8"],
            ["2", "A contact person at the restaurant, and permission to collect information",
             "Access to the menu, staff and customers"],
            ["3", "The full menu: name of each dish, category, price, description, main "
                  "ingredients and dietary information",
             "Loaded into the system; the basis of content-based filtering"],
            ["4", "A description of how customers choose and order today, and who advises them",
             "Flowchart of the current system (Chapter 4); problem statement (Chapter 1)"],
            ["5", "Photos of the dishes, or permission to take them", "Menu screens"],
            ["6", "Interviews with the manager and waiters",
             "Requirements and findings (Chapter 4)"],
            ["7", "A customer questionnaire: food preferences, and ratings of dishes already tried",
             "Findings (Chapter 4); first data for training the model"],
            ["8", "Sales records, if the restaurant agrees, with no customer names",
             "Popularity scores and \u201cGoes well with\u201d suggestions"],
            ["9", "The organisational structure of the restaurant", "Appendix (section 5.16)"],
        ],
        widths_cm=[1.1, 8.7, 6.8],
        bold_first=False,
        centre_cols=(0,),
    )

    # ---- 8
    doc.add_heading("8. Order of work", level=1)
    para(doc, "The build is planned in six stages. The last column shows which parts of the paper "
              "can be written once a stage is finished, so that writing does not wait until the "
              "end. Dates will be added when the submission deadline is known.", keep_next=True)
    data_table(
        doc,
        ["Stage", "What is done", "What can then be written"],
        [
            ["1. Fieldwork and setup",
             "Information collected from the restaurant; requirements agreed; project set up",
             "Chapters 1 to 3; the current-system part of Chapter 4"],
            ["2. Menu and management",
             "Database, sign-in and the manager\u2019s menu screens",
             "Requirements and diagrams in Chapter 4; database design in Chapter 5"],
            ["3. Customer screens",
             "Menu browsing, preference questions, ratings and orders",
             "Screen designs in Chapter 5"],
            ["4. Recommendation engine",
             "The hybrid model, \u201cGoes well with\u201d suggestions and the quality checks",
             "Recommendation design in Chapter 5"],
            ["5. Testing and hosting",
             "Tests with real users; system placed online",
             "Chapter 6"],
            ["6. Handover",
             "Final diagrams, screenshots, code extracts, user manual and technical guide",
             "Chapter 7 and the appendix; practice for the demonstration"],
        ],
        widths_cm=[3.9, 6.6, 6.1],
    )

    # ---- 9
    doc.add_heading("9. Points to confirm with the supervisor", level=1)
    list_items(doc, [
        "**Outside help.** How much technical help from another person is allowed, and how it "
        "should be acknowledged. The declaration (Appendix B of the guidelines) states that the "
        "project is the student\u2019s original work, and she presents and demonstrates the "
        "system herself, for 40 of the 100 marks (section 9.0). She therefore needs to take part "
        "in the build closely enough to explain every screen and every step of section 4.",
        "**Version of the guidelines.** The copy used here is dated August 2012. Ask whether a "
        "newer version applies, since papers that depart from the required format are rejected "
        "(section 9.0).",
        "**Length.** Section 1.0 asks for 15,000 words, while the chapter page limits total 39 "
        "pages at most. Ask which measure the coordinator checks.",
        "**Name of the restaurant.** The spelling on the title page must match the approved "
        "proposal and the name the restaurant itself uses.",
        "**Development model.** Whether a particular model is preferred for Chapter 3. The stages "
        "in section 8 fit an iterative (Agile) model.",
        "**Simulated data.** Whether simulated data may be used beside real data, provided the "
        "paper declares it.",
    ], lists.new_numbered(), last_after=0)

    doc.save(OUT)
    print("saved", OUT)


if __name__ == "__main__":
    build()
