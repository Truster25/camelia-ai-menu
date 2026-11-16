#!/usr/bin/env python3
"""Render the languages .docx to a self-contained HTML page for the browser.

The .docx stays the deliverable for the supervisor; this HTML exists so the
same content can be read directly in Arena's file viewer.
"""
from docx import Document
from docx.table import Table
from docx.text.paragraph import Paragraph
from docx.oxml.ns import qn
import datetime, html, re

SRC = "/home/user/camelia-ai-menu/MP3/camelia-project/docs/Programming-Languages-and-Tools.docx"
OUT = "/home/user/camelia-ai-menu/MP3/camelia-project/docs/Programming-Languages-and-Tools.html"

doc = Document(SRC)


def is_h1(p):
    return p.runs and p.runs[0].font.size and p.runs[0].font.size.pt >= 13


def is_h2(p):
    r = p.runs[0] if p.runs else None
    if not r or not r.font.color or not r.font.color.rgb:
        return False
    return str(r.font.color.rgb) == "8A5A2B" and r.font.bold


def iter_block_items(parent):
    body = parent.element.body
    for child in body.iterchildren():
        if child.tag == qn("w:p"):
            yield Paragraph(child, parent)
        elif child.tag == qn("w:tbl"):
            yield Table(child, parent)


parts = []
first_h1 = True
# Body index of the first numbered section ("1.  THE SHORT ANSWER"). Everything
# before it is the .docx cover block, which the HTML masthead replaces.
first_numbered = None
for idx, block in enumerate(iter_block_items(doc)):
    if isinstance(block, Paragraph) and re.match(r"^1\.\s", block.text.strip()):
        first_numbered = idx
        break

for idx, block in enumerate(iter_block_items(doc)):
    if first_numbered is not None and idx < first_numbered:
        continue
    if isinstance(block, Paragraph):
        text = block.text.strip()
        if not text:
            continue
        if is_h1(block):
            if not first_h1:
                parts.append("</section>")
            first_h1 = False
            parts.append(f'<section class="block"><h2 class="h1">{html.escape(text)}</h2>')
        elif is_h2(block):
            parts.append(f'<h3 class="h2">{html.escape(text)}</h3>')
        elif block.style.name == "List Bullet":
            parts.append(f'<li>{html.escape(text)}</li>')
        elif block.style.name == "List Number":
            parts.append(f'<li class="num">{html.escape(text)}</li>')
        else:
            parts.append(f"<p>{html.escape(text)}</p>")
    else:  # table
        rows = block.rows
        if len(rows) == 1 and len(rows[0].cells) == 1:
            cell = rows[0].cells[0]
            title = cell.paragraphs[0].text.strip()
            body = " ".join(p.text.strip() for p in cell.paragraphs[1:]).strip()
            parts.append(
                f'<div class="callout"><div class="callout-title">{html.escape(title)}</div>'
                f'<div class="callout-body">{html.escape(body)}</div></div>'
            )
            continue
        head = [c.text.strip() for c in rows[0].cells]
        parts.append('<div class="tw"><table>')
        parts.append("<thead><tr>" + "".join(f"<th>{html.escape(h)}</th>" for h in head) + "</tr></thead><tbody>")
        for row in rows[1:]:
            cells = [c.text.strip() for c in row.cells]
            tds = []
            for i, c in enumerate(cells):
                cls = ' class="lead"' if i == 0 else ""
                safe = html.escape(c).replace(chr(10), "<br>")
                tds.append("<td" + cls + ">" + safe + "</td>")
            parts.append("<tr>" + "".join(tds) + "</tr>")
        parts.append("</tbody></table></div>")

parts.append("</section>")
content = "\n".join(parts)

# Group consecutive list items into real, closed lists.
import re
def group_lists(text):
    def repl(match):
        return "<ul>" + match.group(0) + "</ul>"
    text = re.sub(r'(?:<li class="num">.*?</li>\n?)+', repl, text, flags=re.S)
    text = re.sub(r'(?:<li>.*?</li>\n?)+', repl, text, flags=re.S)
    return text
content = group_lists(content)

generated = datetime.datetime.now().strftime("%d %B %Y")

page = f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Programming Languages and Development Tools — Camelia</title>
<style>
  :root {{
    --ink:#1f221b; --muted:#5a5f54; --accent:#8a5a2b;
    --cream:#f6f3ec; --card:#fffdf8; --rule:#ddd7c8;
  }}
  * {{ box-sizing:border-box; }}
  body {{
    margin:0; background:var(--cream); color:var(--ink);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;
    -webkit-font-smoothing:antialiased;
  }}
  .page {{ max-width:860px; margin:0 auto; padding:56px 28px 96px; }}
  .masthead {{ border-bottom:2px solid var(--accent); padding-bottom:22px; margin-bottom:38px; }}
  .eyebrow {{
    font-size:11px; font-weight:700; letter-spacing:.14em; text-transform:uppercase;
    color:var(--accent); margin:0 0 10px;
  }}
  h1.title {{
    font-family:Georgia,"Times New Roman",serif; font-size:clamp(28px,4.4vw,40px);
    line-height:1.15; margin:0 0 14px; font-weight:700; letter-spacing:-.01em;
  }}
  .lede {{ color:var(--muted); font-size:16px; margin:0 0 18px; max-width:62ch; }}
  .meta {{ font-size:13px; color:var(--muted); display:flex; gap:28px; flex-wrap:wrap; }}
  .meta strong {{ color:var(--ink); font-weight:600; }}

  section.block {{ margin:0 0 34px; }}
  h2.h1 {{
    font-size:13px; letter-spacing:.10em; text-transform:uppercase; font-weight:800;
    color:var(--ink); margin:44px 0 14px; padding-bottom:7px;
    border-bottom:1px solid var(--accent);
  }}
  h2.h1:first-child {{ margin-top:0; }}
  h3.h2 {{ font-size:16px; color:var(--accent); margin:26px 0 8px; font-weight:700; }}
  p {{ margin:0 0 12px; max-width:70ch; }}
  ul {{ margin:0 0 14px; padding-left:22px; }}
  li {{ margin-bottom:7px; max-width:68ch; }}
  li b, li strong {{ color:var(--ink); }}

  .callout {{
    background:#f1ede3; border-left:3px solid var(--accent);
    padding:16px 20px; border-radius:6px; margin:18px 0 22px;
  }}
  .callout-title {{
    font-size:11px; font-weight:800; letter-spacing:.10em; text-transform:uppercase;
    color:var(--accent); margin-bottom:7px;
  }}
  .callout-body {{ font-size:15px; }}

  .tw {{ overflow-x:auto; margin:16px 0 24px; border:1px solid var(--rule); border-radius:8px; }}
  table {{ width:100%; border-collapse:collapse; font-size:14px; background:var(--card); min-width:520px; }}
  th {{
    text-align:left; background:#f1ede3; font-size:12px; text-transform:uppercase;
    letter-spacing:.06em; padding:11px 13px; border-bottom:1px solid var(--rule); font-weight:700;
  }}
  td {{ padding:11px 13px; border-bottom:1px solid #efeae0; vertical-align:top; }}
  tr:last-child td {{ border-bottom:none; }}
  tr:nth-child(even) td {{ background:#faf8f3; }}
  td.lead {{ font-weight:600; white-space:nowrap; }}
  .note {{ font-size:13px; color:var(--muted); font-style:italic; }}
  @media print {{
    body {{ background:#fff; }}
    .page {{ max-width:none; padding:0; }}
    .tw {{ overflow:visible; }}
  }}
</style>
</head>
<body>
<div class="page">
  <header class="masthead">
    <p class="eyebrow">Camelia Restaurant · AI-Based Menu Recommendation System</p>
    <h1 class="title">Programming Languages and Development Tools Used</h1>
    <p class="lede">A technical note prepared for the supervisor, stating the languages used to build the
      system, the role of each one, and the chapters of the project paper in which they should be described.</p>
    <div class="meta">
      <span><strong>Prepared by:</strong> the student (author of the project paper)</span>
      <span><strong>Date:</strong> {generated}</span>
    </div>
  </header>
  {content}
</div>
</body>
</html>
"""

with open(OUT, "w") as fh:
    fh.write(page)
print("written:", OUT)
