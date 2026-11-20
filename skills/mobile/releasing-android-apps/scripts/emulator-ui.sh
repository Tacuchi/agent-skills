#!/bin/sh
# emulator-ui.sh: inspect visible nodes, tap by label, and capture screenshots on an Android emulator.
set -eu

usage() {
  cat <<'EOF'
Usage: emulator-ui.sh <command> [args]

Commands:
  dump                  Print visible node labels, center coordinates, and interactions.
  tap "<text>" [index]  Tap the matching node whose text or content-desc contains <text>
                        (0-based index, default: 0).
  shot <output.png>     Capture a PNG screenshot from the active device or emulator.
  -h, --help            Show this help message.

Environment variables:
  ADB                   Explicit path to adb (defaults to PATH, ANDROID_HOME, or ANDROID_SDK_ROOT).
  ANDROID_CLI           Explicit path to the android CLI (defaults to 'android' in PATH).
  ANDROID_HOME          Android SDK directory used to locate platform-tools/adb.
  ANDROID_SDK_ROOT      Fallback Android SDK directory used to locate platform-tools/adb.
  ADB_SERIAL            Optional device serial passed to adb (-s) and android (--device).
EOF
}

resolve_adb() {
  if [ -n "${ADB:-}" ] && [ -x "$ADB" ]; then
    printf '%s\n' "$ADB"
    return 0
  fi
  if command -v adb >/dev/null 2>&1; then
    command -v adb
    return 0
  fi
  if [ -n "${ANDROID_HOME:-}" ] && [ -x "$ANDROID_HOME/platform-tools/adb" ]; then
    printf '%s\n' "$ANDROID_HOME/platform-tools/adb"
    return 0
  fi
  if [ -n "${ANDROID_SDK_ROOT:-}" ] && [ -x "$ANDROID_SDK_ROOT/platform-tools/adb" ]; then
    printf '%s\n' "$ANDROID_SDK_ROOT/platform-tools/adb"
    return 0
  fi
  echo "Error: adb not found. Add platform-tools to PATH or set ANDROID_HOME, ANDROID_SDK_ROOT, or ADB." >&2
  return 1
}

resolve_android_cli() {
  if [ -n "${ANDROID_CLI:-}" ] && [ -x "$ANDROID_CLI" ]; then
    printf '%s\n' "$ANDROID_CLI"
    return 0
  fi
  if command -v android >/dev/null 2>&1; then
    command -v android
    return 0
  fi
  echo "Error: 'android' CLI not found in PATH. Install it or set ANDROID_CLI." >&2
  return 1
}

run_adb() {
  adb_bin="$(resolve_adb)"
  if [ -n "${ADB_SERIAL:-}" ]; then
    "$adb_bin" -s "$ADB_SERIAL" "$@"
  else
    "$adb_bin" "$@"
  fi
}

run_layout() {
  cli_bin="$(resolve_android_cli)"
  if [ -n "${ADB_SERIAL:-}" ]; then
    "$cli_bin" --no-metrics layout --device="$ADB_SERIAL" 2>/dev/null
  else
    "$cli_bin" --no-metrics layout 2>/dev/null
  fi
}

if [ $# -lt 1 ]; then
  usage >&2
  exit 2
fi

case "$1" in
  -h|--help|help)
    usage
    exit 0
    ;;
  dump)
    run_layout | python3 -c '
import json, sys

def walk(node):
    if isinstance(node, list):
        for item in node:
            walk(item)
    elif isinstance(node, dict):
        label = node.get("text") or node.get("content-desc")
        if label:
            interactions = ",".join(node.get("interactions", []))[:30]
            print(repr(label)[:70], node.get("center"), interactions)
        walk(node.get("content", []))
        walk(node.get("children", []))

walk(json.load(sys.stdin))
'
    ;;
  tap)
    if [ $# -lt 2 ]; then
      echo "Error: tap requires a text query." >&2
      usage >&2
      exit 2
    fi
    query="$2"
    index="${3:-0}"
    coords="$(run_layout | python3 -c '
import json, sys

query = sys.argv[1]
index = int(sys.argv[2])
found = []

def walk(node):
    if isinstance(node, list):
        for item in node:
            walk(item)
    elif isinstance(node, dict):
        combined = (node.get("text") or "") + "|" + (node.get("content-desc") or "")
        if query in combined and node.get("center"):
            found.append(node["center"])
        walk(node.get("content", []))
        walk(node.get("children", []))

walk(json.load(sys.stdin))
if 0 <= index < len(found):
    print(str(found[index]).strip("[]").replace(",", " "))
' "$query" "$index")"
    if [ -z "$coords" ]; then
      echo "Not found: $query (index $index)" >&2
      exit 1
    fi
    # Split "x y" safely in POSIX sh.
    set -- $coords
    if [ $# -ne 2 ]; then
      echo "Error: unexpected coordinates for $query: $coords" >&2
      exit 1
    fi
    run_adb shell input tap "$1" "$2"
    printf 'Tapped %s @ %s %s\n' "$query" "$1" "$2"
    ;;
  shot)
    if [ $# -lt 2 ]; then
      echo "Error: shot requires an output file path." >&2
      usage >&2
      exit 2
    fi
    output="$2"
    run_adb exec-out screencap -p > "$output"
    printf '%s\n' "$output"
    ;;
  *)
    echo "Error: unknown command '$1'." >&2
    usage >&2
    exit 2
    ;;
esac
