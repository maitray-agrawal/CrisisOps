def test_get_sops(client):
    response = client.get("/api/sops")
    assert response.status_code == 200
    sops = response.json()
    assert len(sops) >= 3
    sop_codes = [s["sop_code"] for s in sops]
    assert "SOP-M204-BEARING" in sop_codes


def test_get_sop_detail(client):
    response = client.get("/api/sops/SOP-M204-BEARING")
    assert response.status_code == 200
    sop = response.json()
    assert sop["sop_code"] == "SOP-M204-BEARING"
    assert "Drive Bearing Emergency Response" in sop["content_markdown"]
