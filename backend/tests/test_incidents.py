def test_get_incidents(client):
    response = client.get("/api/incidents")
    assert response.status_code == 200
    incidents = response.json()
    assert len(incidents) >= 1
    assert incidents[0]["id"] == "INC-M204-001"
    assert incidents[0]["severity"] == "CRITICAL"


def test_get_incident_detail(client):
    response = client.get("/api/incidents/INC-M204-001")
    assert response.status_code == 200
    incident = response.json()
    assert incident["id"] == "INC-M204-001"
    assert len(incident["evidence_items"]) >= 2
    assert len(incident["action_recommendations"]) >= 1


def test_get_incident_evidence(client):
    response = client.get("/api/incidents/INC-M204-001/evidence")
    assert response.status_code == 200
    evidence = response.json()
    assert len(evidence) >= 2
    assert "source_type" in evidence[0]


def test_get_incident_actions(client):
    response = client.get("/api/incidents/INC-M204-001/actions")
    assert response.status_code == 200
    actions = response.json()
    assert len(actions) >= 1
    assert actions[0]["priority"] == "CRITICAL"
