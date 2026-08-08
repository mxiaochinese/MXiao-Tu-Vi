#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT="${1:-$ROOT/verapdf-report.xml}"
PDF="$ROOT/sample/MXiao-Tu-Vi-2026-text-final.pdf"

run_local() {
  local bin="$1"
  "$bin" -f ua1 "$PDF" > "$REPORT"
}

if [[ -n "${VERAPDF_BIN:-}" ]]; then
  run_local "$VERAPDF_BIN"
elif command -v verapdf >/dev/null 2>&1; then
  run_local "$(command -v verapdf)"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$ROOT:/data" verapdf/cli:v1.30.2 \
    -f ua1 /data/sample/MXiao-Tu-Vi-2026-text-final.pdf > "$REPORT"
else
  cat >&2 <<'MSG'
Không tìm thấy veraPDF CLI hoặc Docker.
Cài veraPDF 1.30.2 rồi chạy lại với:
  VERAPDF_BIN=/duong-dan/toi/verapdf npm run test:pdfua
Hoặc chạy job pdfua trong GitHub Actions.
MSG
  exit 2
fi

python3 "$ROOT/tests/verify_verapdf_report.py" "$REPORT"
printf 'veraPDF XML report: %s\n' "$REPORT"
