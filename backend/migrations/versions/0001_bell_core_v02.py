"""Bell Core v0.2 initial schema"""
from alembic import op
import sqlalchemy as sa
revision='0001'; down_revision=None; branch_labels=None; depends_on=None
def upgrade():
    # The metadata is intentionally centralized; this first migration creates the complete v0.2 schema.
    from app.database import Base
    from app import models
    Base.metadata.create_all(bind=op.get_bind())
def downgrade():
    from app.database import Base
    from app import models
    Base.metadata.drop_all(bind=op.get_bind())
