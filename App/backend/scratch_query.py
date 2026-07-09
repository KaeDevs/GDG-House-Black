import psycopg2
import os
from dotenv import load_dotenv

load_dotenv(".env")
conn = psycopg2.connect(os.getenv("DATABASE_URL"))
cur = conn.cursor()
cur.execute("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'school_complete'")
columns = [r[0] for r in cur.fetchall()]
print("Total columns:", len(columns))
print("Sample:", columns[:30])
print("Specifics:")
for c in columns:
    if "enrol" in c or "teach" in c or "lat" in c or "lon" in c or "water" in c or "elec" in c or "toilet" in c or "bound" in c or "lib" in c:
        print(c)
