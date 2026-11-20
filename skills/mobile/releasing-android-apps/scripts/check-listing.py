#!/usr/bin/env python3
"""Validate Google Play store listing text against length limits and forbidden terms.

Reads a markdown file containing <!-- name -->, <!-- short -->, and <!-- full -->
comment blocks, or accepts text directly via --name, --short, and --full flags.
Exits 0 when all checks pass, 1 on any violation, and 2 on invalid arguments or I/O errors.
"""

import argparse
import pathlib
import re
import sys

DEFAULT_LIMITS = {
    "name": 30,
    "short": 80,
    "full": 4000,
}

DEFAULT_FORBIDDEN = [
    r"download",
    r"downloader",
    r"save\s+videos?",
    r"video\s+saver",
    r"rip\s+videos?",
    r"grab\s+videos?",
]


def parse_args(argv):
    parser = argparse.ArgumentParser(
        description=(
            "Check Google Play store listing text against character limits "
            "(default: name 30, short 80, full 4000) and forbidden terms."
        )
    )
    parser.add_argument(
        "file",
        nargs="?",
        help="Markdown file with <!-- name -->, <!-- short -->, and <!-- full --> blocks.",
    )
    parser.add_argument("--name", help="App name text (overrides or replaces file block).")
    parser.add_argument("--short", help="Short description text (overrides or replaces file block).")
    parser.add_argument("--full", help="Full description text (overrides or replaces file block).")
    parser.add_argument(
        "--limit-name",
        type=int,
        default=DEFAULT_LIMITS["name"],
        help=f"Maximum characters for app name (default: {DEFAULT_LIMITS['name']}).",
    )
    parser.add_argument(
        "--limit-short",
        type=int,
        default=DEFAULT_LIMITS["short"],
        help=f"Maximum characters for short description (default: {DEFAULT_LIMITS['short']}).",
    )
    parser.add_argument(
        "--limit-full",
        type=int,
        default=DEFAULT_LIMITS["full"],
        help=f"Maximum characters for full description (default: {DEFAULT_LIMITS['full']}).",
    )
    parser.add_argument(
        "--forbidden",
        action="append",
        default=[],
        metavar="PATTERN",
        help="Additional case-insensitive regex pattern to forbid (repeatable).",
    )
    parser.add_argument(
        "--forbidden-file",
        metavar="PATH",
        help="File with one case-insensitive forbidden regex per line (blank lines and # comments ignored).",
    )
    parser.add_argument(
        "--no-default-forbidden",
        action="store_true",
        help="Disable the built-in download-related forbidden terms.",
    )
    return parser.parse_args(argv)


def load_forbidden_patterns(args):
    patterns = [] if args.no_default_forbidden else list(DEFAULT_FORBIDDEN)
    if args.forbidden_file:
        fpath = pathlib.Path(args.forbidden_file)
        if not fpath.is_file():
            print(f"Error: forbidden-terms file not found: {fpath}", file=sys.stderr)
            sys.exit(2)
        for raw_line in fpath.read_text(encoding="utf-8").splitlines():
            line = raw_line.strip()
            if line and not line.startswith("#"):
                patterns.append(line)
    patterns.extend(args.forbidden)
    compiled = []
    for pat in patterns:
        try:
            compiled.append(re.compile(pat, re.IGNORECASE))
        except re.error as exc:
            print(f"Error: invalid forbidden regex '{pat}': {exc}", file=sys.stderr)
            sys.exit(2)
    return compiled


def extract_block(text, field):
    pattern = rf"<!--\s*{re.escape(field)}\s*-->\r?\n(.*?)\r?\n<!--\s*/{re.escape(field)}\s*-->"
    match = re.search(pattern, text, re.DOTALL)
    if not match:
        return None
    return match.group(1).strip()


def main(argv=None):
    args = parse_args(sys.argv[1:] if argv is None else argv)

    direct_values = {
        "name": args.name,
        "short": args.short,
        "full": args.full,
    }
    has_direct = any(value is not None for value in direct_values.values())

    file_text = None
    if args.file:
        path = pathlib.Path(args.file)
        if not path.is_file():
            print(f"Error: listing file not found: {path}", file=sys.stderr)
            return 2
        file_text = path.read_text(encoding="utf-8")
    elif not has_direct:
        print(
            "Error: provide a listing markdown file or --name/--short/--full flags. Use --help for usage.",
            file=sys.stderr,
        )
        return 2

    limits = {
        "name": args.limit_name,
        "short": args.limit_short,
        "full": args.limit_full,
    }
    forbidden_patterns = load_forbidden_patterns(args)

    ok = True
    for field in ("name", "short", "full"):
        limit = limits[field]
        if direct_values[field] is not None:
            value = direct_values[field].strip()
        elif file_text is not None:
            value = extract_block(file_text, field)
            if value is None:
                print(f"{field}: missing block")
                ok = False
                continue
        else:
            print(f"{field}: missing value")
            ok = False
            continue

        size = len(value)
        if size == 0:
            print(f"{field}: 0/{limit} EMPTY")
            ok = False
        elif size > limit:
            print(f"{field}: {size}/{limit} OVER LIMIT")
            ok = False
        else:
            print(f"{field}: {size}/{limit} OK")

        for regex in forbidden_patterns:
            found = regex.search(value)
            if found:
                print(f"{field}: forbidden term matched ({found.group(0)!r})")
                ok = False

    return 0 if ok else 1


if __name__ == "__main__":
    sys.exit(main())
