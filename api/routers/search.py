from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session as DBSession
from sqlalchemy import text

from api.auth import current_user, get_user_council_id, is_admin
from api.database import get_db
from api.models.auth import User

router = APIRouter(prefix="/search", tags=["search"])


@router.get("")
def search(
    q: str = Query(..., min_length=2),
    scope: str = Query(default="all"),
    user: User = Depends(current_user),
    db: DBSession = Depends(get_db),
):
    council_id = get_user_council_id(user, db)
    if not council_id and not is_admin(user, db):
        return {"threads": [], "documents": []}

    results = {"threads": [], "documents": []}
    tsquery = " & ".join(q.split())

    if scope in ("all", "threads"):
        sql = text("""
            SELECT DISTINCT t.id, t.title, t.reply_count, t.last_activity_at,
                   ts_rank(p.search_vector, to_tsquery('english', :q)) as rank
            FROM posts p
            JOIN threads t ON t.id = p.thread_id
            WHERE p.search_vector @@ to_tsquery('english', :q)
              AND (:council_id IS NULL OR t.council_id = :council_id)
            ORDER BY rank DESC
            LIMIT 20
        """)
        rows = db.execute(sql, {"q": tsquery, "council_id": council_id}).fetchall()
        results["threads"] = [
            {"id": r[0], "title": r[1], "reply_count": r[2],
             "last_activity_at": str(r[3]), "rank": float(r[4])}
            for r in rows
        ]

    if scope in ("all", "documents"):
        sql = text("""
            SELECT id, display_name, filename, category, created_at,
                   ts_rank(search_vector, to_tsquery('english', :q)) as rank
            FROM documents
            WHERE search_vector @@ to_tsquery('english', :q)
              AND (:council_id IS NULL OR council_id = :council_id)
            ORDER BY rank DESC
            LIMIT 20
        """)
        rows = db.execute(sql, {"q": tsquery, "council_id": council_id}).fetchall()
        results["documents"] = [
            {"id": r[0], "display_name": r[1], "filename": r[2],
             "category": r[3], "created_at": str(r[4]), "rank": float(r[5])}
            for r in rows
        ]

    return results
