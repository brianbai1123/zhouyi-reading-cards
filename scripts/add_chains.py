"""把 scripts/chains_*.py 里的逻辑因果链写进 data/hexagrams.json 的 plain.chain / plain.breaks。"""

import importlib
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
DATA = ROOT / "data" / "hexagrams.json"
PARTS = ["01_08", "09_16", "17_24", "25_32", "33_40", "41_48", "49_56", "57_64"]


def load_chains():
    sys.path.insert(0, str(ROOT / "scripts"))
    chains = {}
    for part in PARTS:
        if (ROOT / "scripts" / f"chains_{part}.py").exists():
            chains.update(importlib.import_module(f"chains_{part}").CHAINS)
    return chains


def with_chain(plain, entry):
    out = {}
    for key, value in plain.items():
        if key in ("chain", "breaks"):
            continue
        out[key] = value
        if key == "core":
            out["chain"] = entry["chain"]
            out["breaks"] = entry["breaks"]
    return out


def main():
    hexagrams = json.loads(DATA.read_text(encoding="utf-8"))
    chains = load_chains()
    for h in hexagrams:
        if h["id"] in chains:
            h["plain"] = with_chain(h["plain"], chains[h["id"]])
    DATA.write_text(json.dumps(hexagrams, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"wrote chains for {len(chains)} hexagrams")


if __name__ == "__main__":
    main()
