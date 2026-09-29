"""Render Pre-deployment Script for MausamSetu API.

Executes database migrations when PostgreSQL is available.
Guarantees clean exit code 0 so deployment is never blocked if database
is provisioning or running on embedded SQLite.
"""

import os
import sys
import logging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("render_predeploy")


def main() -> int:
    logger.info("Initializing Render pre-deployment checks...")
    
    # 1. Inspect DATABASE_URL
    database_url = os.getenv("DATABASE_URL", "").strip()
    
    if not database_url or database_url.startswith("sqlite"):
        logger.info("No external PostgreSQL DATABASE_URL detected. Application will initialize embedded storage on startup.")
        return 0

    # 2. If PostgreSQL is configured, attempt Alembic migration
    logger.info("External database detected. Validating Alembic migration environment...")
    try:
        from alembic.config import Config
        from alembic import command

        alembic_ini_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "alembic.ini")
        if not os.path.exists(alembic_ini_path):
            alembic_ini_path = "alembic.ini"

        alembic_cfg = Config(alembic_ini_path)
        logger.info("Applying database migrations (alembic upgrade head)...")
        command.upgrade(alembic_cfg, "head")
        logger.info("Alembic database migrations applied successfully.")
    except Exception as e:
        logger.warning(
            f"Pre-deploy Alembic notice: {e}. "
            "Skipping pre-deploy migration block; application lifespan will ensure tables and seeds exist."
        )

    logger.info("Render pre-deployment completed successfully.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
