import urllib.request
from urllib.error import HTTPError
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/recommendations?district=ADILABAD')
try:
    urllib.request.urlopen(req)
except HTTPError as e:
    print(e.read().decode())
