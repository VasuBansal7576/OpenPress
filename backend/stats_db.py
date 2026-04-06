import sqlite3
import os

DB_PATH = os.path.join(os.path.dirname(__file__), "stats.db")

def _get_conn():
    conn = sqlite3.connect(DB_PATH)
    conn.execute("""
        CREATE TABLE IF NOT EXISTS run_stats (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            total_runs INTEGER DEFAULT 0,
            total_claims INTEGER DEFAULT 0,
            total_sources INTEGER DEFAULT 0,
            total_confidence_sum INTEGER DEFAULT 0
        )
    """)
    # Ensure the single row exists
    conn.execute("INSERT OR IGNORE INTO run_stats (id) VALUES (1)")
    conn.commit()
    return conn

def record_run(claim_count: int, source_count: int, confidence: int):
    """Call after every successful investigation or audit run."""
    conn = _get_conn()
    conn.execute("""
        UPDATE run_stats SET
            total_runs = total_runs + 1,
            total_claims = total_claims + ?,
            total_sources = total_sources + ?,
            total_confidence_sum = total_confidence_sum + ?
        WHERE id = 1
    """, (claim_count, source_count, confidence))
    conn.commit()
    conn.close()

def get_stats() -> dict:
    conn = _get_conn()
    row = conn.execute("SELECT total_runs, total_claims, total_sources, total_confidence_sum FROM run_stats WHERE id = 1").fetchone()
    conn.close()
    total_runs, total_claims, total_sources, total_confidence_sum = row
    avg_confidence = (total_confidence_sum / total_runs) if total_runs > 0 else 0
    return {
        "avg_confidence": avg_confidence,
        "total_runs": total_runs,
        "total_claims": total_claims,
        "total_sources": total_sources,
    }
