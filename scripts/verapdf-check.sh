#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT_TUVI="${1:-$ROOT/verapdf-report.xml}"
REPORT_ASTROLOGY="${2:-$ROOT/verapdf-astrology-report.xml}"
PDF_TUVI="$ROOT/sample/MXiao-Tu-Vi-2026-text-final.pdf"
PDF_ASTROLOGY="$ROOT/sample/MXiao-Ban-Do-Sao-final.pdf"

run_local() {
  local bin="$1"
  local pdf="$2"
  local report="$3"
  "$bin" -f ua1 "$pdf" > "$report"
}

if [[ -n "${VERAPDF_BIN:-}" ]]; then
  run_local "$VERAPDF_BIN" "$PDF_TUVI" "$REPORT_TUVI"
  run_local "$VERAPDF_BIN" "$PDF_ASTROLOGY" "$REPORT_ASTROLOGY"
elif command -v verapdf >/dev/null 2>&1; then
  run_local "$(command -v verapdf)" "$PDF_TUVI" "$REPORT_TUVI"
  run_local "$(command -v verapdf)" "$PDF_ASTROLOGY" "$REPORT_ASTROLOGY"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$ROOT:/data" verapdf/cli:v1.30.2 \
    -f ua1 /data/sample/MXiao-Tu-Vi-2026-text-final.pdf > "$REPORT_TUVI"
  docker run --rm -v "$ROOT:/data" verapdf/cli:v1.30.2 \
    -f ua1 /data/sample/MXiao-Ban-Do-Sao-final.pdf > "$REPORT_ASTROLOGY"
else
  cat >&2 <<'MSG'
Không tìm thấy veraPDF CLI hoặc Docker.
Cài veraPDF 1.30.2 rồi chạy lại với:
  VERAPDF_BIN=/duong-dan/toi/verapdf npm run test:pdfua
Hoặc chạy job pdfua trong GitHub Actions.
MSG
  exit 2
fi

python3 "$ROOT/tests/verify_verapdf_report.py" "$REPORT_TUVI"
python3 "$ROOT/tests/verify_verapdf_report.py" "$REPORT_ASTROLOGY"
printf 'veraPDF XML reports: %s, %s\n' "$REPORT_TUVI" "$REPORT_ASTROLOGY"
