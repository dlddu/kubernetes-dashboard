#!/usr/bin/env python3
import argparse
import hashlib
import os
import re
import subprocess
import sys
from collections import defaultdict

LEDGER = "docs/comment-policy/ledger.md"
SURFACES = {"L": "줄머리 주석 (L)", "E": "줄 끝·줄 중간 주석 (E)", "D": "Python docstring (D)"}


def measure():
    root = os.path.dirname(os.path.abspath(__file__))
    out = subprocess.run(["bash", os.path.join(root, "measure.sh")], check=True, capture_output=True, text=True).stdout
    by = {s: defaultdict(list) for s in SURFACES}
    problems = []
    for line in out.splitlines():
        m = re.match(r"^([LED]):([^:]+):(.*)$", line)
        if m:
            by[m.group(1)][m.group(2)].append(m.group(2) + ":" + m.group(3))
        elif line.startswith(("X:", "unclassified:")):
            problems.append(line)
    return by, problems


def fingerprint(lines):
    return hashlib.sha256("\n".join(sorted(lines)).encode()).hexdigest()[:12]


def parse_ledger(text):
    tables = {}
    surface = None
    for line in text.splitlines():
        h = re.match(r"^## (.+)$", line)
        if h:
            surface = next((k for k, v in SURFACES.items() if h.group(1).strip() == v), None)
            if surface:
                tables[surface] = []
            continue
        if surface and line.startswith("|"):
            cells = [c.strip() for c in line.strip().strip("|").split("|")]
            if len(cells) >= 6 and re.match(r"^\d{4}-\d{2}-\d{2}$", cells[0]):
                tables[surface].append(cells)
    return tables


def check(by, problems):
    errors = list(problems)
    tables = parse_ledger(open(LEDGER, encoding="utf-8").read())
    summary = []
    for s in SURFACES:
        rows = tables.get(s, [])
        seen = {}
        done_lines = pending_rows = done_rows = 0
        for date, scope, count, fp, verdict, result in (r[:6] for r in rows):
            files = re.findall(r"`([^`]+)`", scope)
            if not files:
                errors.append(f"{s}: 범위에 파일이 없는 행: {scope}")
                continue
            if verdict not in ("완료", "—"):
                errors.append(f"{s}: 판정 칸은 완료·—만 유효: {files[0]} ({verdict})")
            lines = [l for f in files for l in by[s].get(f, [])]
            for f in files:
                if f in seen:
                    errors.append(f"{s}: 파일이 두 행에 속함: {f}")
                seen[f] = True
            if str(len(lines)) != count:
                errors.append(f"{s}: 줄 수 불일치 {files[0]} 표={count} 실측={len(lines)}")
            if fingerprint(lines) != fp:
                errors.append(f"{s}: 지문 불일치 {files[0]} 표={fp} 실측={fingerprint(lines)}")
            if verdict == "완료":
                done_rows += 1
                done_lines += len(lines)
            else:
                pending_rows += 1
        for f in by[s]:
            if f not in seen:
                errors.append(f"{s}: 원장에 없는 파일: {f}")
        summary.append(f"{s}: 행 {len(rows)} (완료 {done_rows}, 미판정 {pending_rows}) · 완료 줄 {done_lines}/{sum(len(v) for v in by[s].values())}")
    return errors, summary


def emit(by):
    for s, title in SURFACES.items():
        print(f"## {title}\n")
        print("| 판정일 | 범위 | 현재 줄 수 | 지문 | 판정 | 결과 |\n|---|---|---|---|---|---|")
        for f in sorted(by[s]):
            print(f"| - | `{f}` | {len(by[s][f])} | {fingerprint(by[s][f])} | — | |")
        print()


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--emit", action="store_true")
    args = ap.parse_args()
    by, problems = measure()
    if args.emit:
        emit(by)
        return 0
    errors, summary = check(by, problems)
    print("\n".join(summary))
    if errors:
        print("\n".join(errors), file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
