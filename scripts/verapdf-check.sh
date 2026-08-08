#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPORT="${1:-$ROOT/verapdf-report.xml}"
PDFS=(
  "$ROOT/sample/vu-minh-hieu-la-so-tu-vi-tong-quan.pdf"
  "$ROOT/sample/MXiao-Ban-Do-Sao-final.pdf"
)

run_local() {
  local bin="$1"
  local report="$2"
  "$bin" -f ua1 "${PDFS[@]}" > "$report"
}

if [[ -n "${VERAPDF_BIN:-}" ]]; then
  run_local "$VERAPDF_BIN" "$REPORT"
elif command -v verapdf >/dev/null 2>&1; then
  run_local "$(command -v verapdf)" "$REPORT"
elif command -v docker >/dev/null 2>&1; then
  docker run --rm -v "$ROOT:/data" verapdf/cli:v1.30.2 \
    -f ua1 \
    /data/sample/vu-minh-hieu-la-so-tu-vi-tong-quan.pdf \
    /data/sample/MXiao-Ban-Do-Sao-final.pdf > "$REPORT"
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
