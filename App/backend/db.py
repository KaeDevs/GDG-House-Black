import os
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker, declarative_base
from dotenv import load_dotenv

# Try to load .env for local development
if os.path.exists(".env"):
    load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
<<<<<<< HEAD
    raise RuntimeError("DATABASE_URL environment variable is missing. Configure it in App/backend/.env for local development or Render Environment Variables for production.")

if "your-neon-hostname" in DATABASE_URL or "user:password" in DATABASE_URL:
    raise RuntimeError("DATABASE_URL still contains placeholder values. Please update it with your actual Neon credentials.")
=======
    print("\n" + "=" * 80)
    print(" ERROR: DATABASE_URL environment variable is not set!")
    print(" - For local development: Create a '.env' file in App/backend/ and add:")
    print("   DATABASE_URL=postgresql://user:password@localhost:5432/dbname")
    print(" - For Render deployment: Add a 'DATABASE_URL' environment variable in your service settings,")
    print("   or attach a PostgreSQL database service directly to this Web Service.")
    print("=" * 80 + "\n")
    raise RuntimeError(
        "DATABASE_URL environment variable is missing. "
        "Please configure it in Render's Environment Variables (or in a local '.env' file)."
    )

if "your-neon-hostname" in DATABASE_URL or "user:password" in DATABASE_URL:
    raise RuntimeError(
        "DATABASE_URL contains placeholder values ('your-neon-hostname' or 'user:password'). "
        "Please update it with your actual database credentials."
    )
>>>>>>> 49e4d67351daca48e03b60a2c8ec83b03b0195a1

# Parse and print masked URL
import urllib.parse
try:
    parsed = urllib.parse.urlparse(DATABASE_URL)
    masked_url = f"Connecting to: {parsed.hostname}"
    print(masked_url)
except Exception:
    print("Connecting to database...")

# For pandas to_sql (requires sync engine)
sync_db_url = DATABASE_URL
if sync_db_url.startswith("postgres://"):
    sync_db_url = sync_db_url.replace("postgres://", "postgresql://", 1)

sync_engine = create_engine(sync_db_url, pool_pre_ping=True)

# For FastAPI endpoints (async engine)
async_db_url = sync_db_url.replace("postgresql://", "postgresql+asyncpg://", 1)

# Remove all query parameters for asyncpg (e.g. sslmode, channel_binding)
parsed_async = urllib.parse.urlparse(async_db_url)
async_db_url = urllib.parse.urlunparse(parsed_async._replace(query=""))

connect_args = {"ssl": "require"}

async_engine = create_async_engine(async_db_url, echo=False, connect_args=connect_args)
AsyncSessionLocal = sessionmaker(
    bind=async_engine,
    class_=AsyncSession,
    expire_on_commit=False,
)

Base = declarative_base()

async def get_db():
    session = AsyncSessionLocal()
    try:
        yield session
    except Exception:
        await session.rollback()
        raise
    finally:
        await session.close()
