import urllib.request
import json
try:
    with urllib.request.urlopen("http://localhost:8000/api/districts") as response:
        html = response.read()
        print("Status Code:", response.getcode())
        print("Response:", html.decode('utf-8')[:500])
except Exception as e:
    print("Error:", e)
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
