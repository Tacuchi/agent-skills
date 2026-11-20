#!/usr/bin/env python3
"""Scan a patch, log or marked file stream for possible sensitive data."""

import argparse
from collections import Counter
import re
import sys


PATTERNS = {
    "email": r"(?<![\w.%+-])[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}",
    "phone": r"(?<![\w.])(?:\+\d{1,3}[ -]?)?(?:9\d{2}[ -]?\d{3}[ -]?\d{3}|\(\d{2,3}\)[ -]?\d{3}[ -]?\d{4})(?![\w.])",
    "eight_digit_id": r"(?<![\w.#-])\d{8}(?![\w.-])",
    "github_token": r"\b(?:(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9]{20,}|github_pat_[A-Za-z0-9_]{20,})",
    "google_api_key": r"AIza[0-9A-Za-z_-]{35}",
    "aws_access_key": r"\bAKIA[0-9A-Z]{16}\b",
    "slack_token": r"xox[baprs]-[A-Za-z0-9-]{10,}",
    "model_api_key": r"\bsk-(?:ant-)?[A-Za-z0-9_-]{20,}",
    "private_key": r"-----BEGIN [A-Z ]*PRIVATE KEY-----",
    "jwt": r"\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}",
    "assigned_secret": r"""(?i)(?:password|passwd|pwd|secret|token|api[_-]?key)\s*[:=]\s*['"]?[^\s'"$<>{}()]{4,}""",
    "local_user_path": r"(?:/(?:Users|home)/|[A-Za-z]:\\Users\\)[\w.-]+",
    "keystore": r"(?i)\b[\w-]+\.(?:jks|keystore|p12|pem)\b",
    "privacy_wording": r"(?i)\bprivate\b",
}
PATTERNS = {kind: re.compile(pattern) for kind, pattern in PATTERNS.items()}


def findings(line):
    return sorted((hit.start(), hit.end(), kind)
                  for kind, pattern in PATTERNS.items()
                  for hit in pattern.finditer(line))


def masked(line, hits):
    parts = []
    end = 0
    for start, stop, _ in hits:
        if start >= end:
            parts.extend([line[end:start], "[redacted]"])
        end = max(end, stop)
    return "".join(parts) + line[end:]


def main():
    parser = argparse.ArgumentParser(description=__doc__, epilog=(
        "Read standard input. A Git diff header or FILE:<path> selects the file. "
        "Each summary row contains tab-separated type, file and count."
    ))
    parser.add_argument("--show-context", action="store_true",
                        help="show masked excerpts for local review")
    args = parser.parse_args()
    counts = Counter()
    current = "(input)"
    for raw in sys.stdin.buffer:
        line = raw.decode("utf-8", "replace").rstrip("\r\n")
        if line.startswith("FILE:"):
            path = line[5:]
        elif line.startswith("diff --git "):
            paths = line[len("diff --git "):]
            path = re.split(r' "?b/', paths, maxsplit=1)[0].removeprefix('"').removeprefix("a/").removesuffix('"')
        else:
            if re.fullmatch(r"commit [0-9a-f]{7,64}(?: .*)?", line):
                current = "(commit)"
            hits = findings(line)
            for _, _, kind in hits:
                counts[kind, current] += 1
            if hits and args.show_context:
                print(f"{current}: {masked(line, hits).strip()[:160]}", file=sys.stderr)
            continue
        current = masked(path, findings(path)).replace("\t", r"\t")
    for (kind, path), count in sorted(counts.items()):
        print(f"{kind}\t{path}\t{count}")


if __name__ == "__main__":
    main()
