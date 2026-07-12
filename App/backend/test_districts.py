import urllib.request
try:
    response = urllib.request.urlopen('http://127.0.0.1:8001/api/districts')
    print("Status:", response.status)
    print("Data:", response.read().decode('utf-8'))
except Exception as e:
    print("Error:", e)
