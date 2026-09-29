"""Check that every hexagram's plain explanation carries a well-formed 逻辑因果链."""

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def problems(h):
    plain = h["plain"]
    chain = plain.get("chain")
    breaks = plain.get("breaks")
    name = f"{h['id']} {h['name']}"
    if not chain or len(chain) < 7:
        return [f"{name}: chain needs at least 7 links"]
    out = []
    if "via" in chain[0]:
        out.append(f"{name}: first link must not have via")
    for link in chain[1:]:
        via = link.get("via")
        if not via:
            out.append(f"{name}: link without via: {link['claim']}")
        elif link["claim"].startswith(via):
            out.append(f"{name}: claim repeats via: {link['claim']}")
    for link in chain:
        if not link.get("claim") or len(link.get("detail", "")) < 20:
            out.append(f"{name}: link too thin: {link.get('claim')}")
    if not chain[-1]["claim"].startswith("结果："):
        out.append(f"{name}: last claim must start with 结果：")
    if not breaks or len(breaks) < 2:
        out.append(f"{name}: breaks needs at least 2 lines")
    return out


def main():
    hexagrams = json.loads((ROOT / "data" / "hexagrams.json").read_text(encoding="utf-8"))
    found = [p for h in hexagrams for p in problems(h)]
    if len(hexagrams) != 64:
        found.append(f"expected 64 hexagrams, got {len(hexagrams)}")
    app = (ROOT / "js" / "app.js").read_text(encoding="utf-8")
    if not re.search(r"<h3>核心深讲</h3>[\s\S]*<h3>逻辑因果链</h3>[\s\S]*<h3>卦辞白话</h3>", app):
        found.append("app.js: 逻辑因果链 block must sit between 核心深讲 and 卦辞白话")
    for line in found[:20]:
        print(line)
    print(f"{len(found)} problems")
    sys.exit(1 if found else 0)


if __name__ == "__main__":
    main()
