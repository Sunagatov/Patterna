import json
from pathlib import Path

from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.orm import Session

from .db import engine
from .models import Problem


def seed_catalogue():
    catalogue = Path(__file__).with_name("catalogue.json")
    rows = json.loads(catalogue.read_text(encoding="utf-8"))
    with Session(engine()) as db:
        db.execute(insert(Problem).on_conflict_do_nothing(), rows)
        db.commit()
    print(f"Ensured {len(rows)} catalogue records exist.")


if __name__ == "__main__":
    seed_catalogue()
