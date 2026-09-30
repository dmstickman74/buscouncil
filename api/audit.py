import json
from sqlalchemy.orm import Session
from api.models.notifications import ActivityLog


def log_activity(db: Session, user_id: int | None, action: str,
                 entity_type: str | None = None, entity_id: int | None = None,
                 details: dict | None = None):
    entry = ActivityLog(
        user_id=user_id,
        action=action,
        entity_type=entity_type,
        entity_id=entity_id,
        details=json.dumps(details) if details else None,
    )
    db.add(entry)
