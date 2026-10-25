"""Verify real streaming cancellation and overlap rejection without model mocks."""
import http.client
import json
import time
from pathlib import Path
from datetime import datetime, timezone
from playwright.sync_api import sync_playwright

state = json.loads(Path(".cache/browser-state.json").read_text())
cookie = "; ".join(f"{c['name']}={c['value']}" for c in state["cookies"] if c["domain"] in ("127.0.0.1", "localhost"))
id = json.loads(Path(".cache/restart-deck.json").read_text())["id"]
headers = {"Content-Type": "application/json", "Cookie": cookie}
payload = json.dumps({"id": id, "cardId": "QA01", "prompt": "Review QA01. Save a proposal if necessary."})

def open_stream():
    connection = http.client.HTTPConnection("127.0.0.1", 8081, timeout=30)
    connection.request("POST", "/api/proofdeck-agent", payload, headers)
    response = connection.getresponse()
    return connection, response

connection, response = open_stream()
assert response.status == 200, response.read()
line = response.readline()
assert b'"type":"tool-start"' in line, line
with sync_playwright() as p:
    api = p.request.new_context(storage_state=".cache/browser-state.json")
    overlap = api.post("http://127.0.0.1:8081/api/proofdeck-agent", data=json.loads(payload))
    assert overlap.status == 409, overlap.text()
    response.close(); connection.close()
    reopened_statuses = []
    for _ in range(8):
        time.sleep(1)
        second, reopened = open_stream()
        reopened_statuses.append(reopened.status)
        if reopened.status == 200:
            reopened.readline()
            reopened.close(); second.close()
            break
        reopened.read(); reopened.close(); second.close()
    assert reopened_statuses[-1] == 200, reopened_statuses
    time.sleep(2)
    deck = api.get("http://127.0.0.1:8081/_agent-native/actions/get-deck", params={"id": id}).json()
    assert deck["revision"] == 6 and not deck["content"]["proposals"], deck
    api.dispose()
result = {"time_utc": datetime.now(timezone.utc).isoformat(), "status": "PASS", "checks": ["Concurrent agent request for the same owner/deck rejected with 409", "Closing the real SSE transport cancels the run and frees its slot", "Cancellation before generation leaves the deck and proposals unchanged"], "reopened_statuses": reopened_statuses, "scope": "Real HTTP streaming cancellation; native sidebar Stop button itself not exercised here"}
Path("artifacts/cancellation-verification.json").write_text(json.dumps(result, indent=2))
print(json.dumps(result, indent=2))
