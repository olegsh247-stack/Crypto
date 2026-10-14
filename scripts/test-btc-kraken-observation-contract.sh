#!/usr/bin/env bash
set -euo pipefail

: "${DATABASE_URL:?DATABASE_URL is required}"

# This test deliberately refuses remote or non-test databases. It writes only
# inside a transaction that the SQL fixture always rolls back.
python3 - "$DATABASE_URL" <<'PY'
import sys
from urllib.parse import urlparse

url = urlparse(sys.argv[1])
database = url.path.lstrip("/")
if url.scheme not in ("postgres", "postgresql"):
    raise SystemExit("REFUSED: DATABASE_URL must use PostgreSQL")
if url.hostname not in ("127.0.0.1", "localhost", "::1"):
    raise SystemExit("REFUSED: BTC observation rehearsal only permits loopback PostgreSQL")
if not database.endswith("_test"):
    raise SystemExit("REFUSED: BTC observation rehearsal only permits a database ending in _test")
print(f"BTC_KRAKEN_REHEARSAL_TARGET_OK host={url.hostname} database={database}")
PY

psql "$DATABASE_URL" -X --set=ON_ERROR_STOP=1 --file=scripts/test-btc-kraken-observation-contract.sql
