import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(".env")
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'")
tables = [r[0] for r in cur.fetchall()]
print("Tables:", tables)
