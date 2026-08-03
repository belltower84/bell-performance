"""Bell Coach intelligence and evidence-based coaching memory."""
from alembic import op
import sqlalchemy as sa

revision = '0002'
down_revision = '0001'
branch_labels = None
depends_on = None


def upgrade():
    bind = op.get_bind()
    if 'coaching_memories' in sa.inspect(bind).get_table_names():
        return
    op.create_table(
        'coaching_memories',
        sa.Column('id', sa.String(), primary_key=True),
        sa.Column('athlete_id', sa.String(), sa.ForeignKey('athletes.id'), nullable=False),
        sa.Column('memory_key', sa.String(length=180), nullable=False),
        sa.Column('category', sa.String(length=80), nullable=False, server_default='athlete_preference'),
        sa.Column('observation', sa.Text(), nullable=False),
        sa.Column('confidence', sa.Float(), nullable=False, server_default='1.0'),
        sa.Column('evidence_json', sa.Text(), nullable=False, server_default='{}'),
        sa.Column('source_type', sa.String(length=80), nullable=False, server_default='athlete_explicit'),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column('first_observed', sa.DateTime(timezone=True), nullable=False),
        sa.Column('last_confirmed', sa.DateTime(timezone=True), nullable=False),
        sa.Column('created_at', sa.DateTime(timezone=True), nullable=False),
        sa.UniqueConstraint('athlete_id', 'memory_key'),
    )
    op.create_index('ix_coaching_memories_athlete_id', 'coaching_memories', ['athlete_id'])
    op.create_index('ix_coaching_memories_memory_key', 'coaching_memories', ['memory_key'])
    op.create_index('ix_coaching_memories_is_active', 'coaching_memories', ['is_active'])


def downgrade():
    bind = op.get_bind()
    if 'coaching_memories' not in sa.inspect(bind).get_table_names():
        return
    op.drop_index('ix_coaching_memories_is_active', table_name='coaching_memories')
    op.drop_index('ix_coaching_memories_memory_key', table_name='coaching_memories')
    op.drop_index('ix_coaching_memories_athlete_id', table_name='coaching_memories')
    op.drop_table('coaching_memories')
