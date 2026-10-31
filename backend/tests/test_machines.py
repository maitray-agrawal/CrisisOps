def test_get_machines(client):
    response = client.get("/api/machines")
    assert response.status_code == 200
    machines = response.json()
    assert len(machines) >= 3
    machine_ids = [m["id"] for m in machines]
    assert "M-204" in machine_ids
    assert "M-101" in machine_ids
    assert "M-305" in machine_ids


def test_get_machine_detail(client):
    response = client.get("/api/machines/M-204")
    assert response.status_code == 200
    detail = response.json()
    assert detail["id"] == "M-204"
    assert detail["status"] == "CRITICAL"
    assert len(detail["recent_telemetry"]) > 0
    assert len(detail["maintenance_records"]) > 0


def test_get_machine_telemetry(client):
    response = client.get("/api/machines/M-204/telemetry?limit=10")
    assert response.status_code == 200
    telemetry = response.json()
    assert len(telemetry) == 10
    assert "vibration_mm_s" in telemetry[0]
    assert "temp_celsius" in telemetry[0]


def test_get_machine_not_found(client):
    response = client.get("/api/machines/NON-EXISTENT")
    assert response.status_code == 404
