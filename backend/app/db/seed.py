from datetime import datetime, timedelta, timezone
from app.core.database import engine, Base, SessionLocal
from app.models.models import (
    Machine,
    TelemetryRecord,
    MaintenanceRecord,
    Incident,
    Evidence,
    SOPDocument,
    ActionRecommendation
)


def seed_database():
    """Populate database with deterministic synthetic industrial data for Machine M-204 demo."""
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    try:
        now = datetime.now(timezone.utc)

        # 1. Create Machines
        m204 = Machine(
            id="M-204",
            name="Main Hydraulic Drive & Bearing Assembly",
            type="Heavy Hydraulic System",
            location="Line B - Station 4",
            status="CRITICAL",
            description="Primary hydraulic drive unit for Main Assembly Line B. Rated for 100 units/min."
        )

        m101 = Machine(
            id="M-101",
            name="Centrifugal Auxiliary Cooling Pump",
            type="Fluid Coolant System",
            location="Line A - Cooling Station",
            status="NORMAL",
            description="Auxiliary cooling circulation pump for Line A."
        )

        m305 = Machine(
            id="M-305",
            name="Main Turbine Power Generator",
            type="Power Generation System",
            location="Substation 2",
            status="NORMAL",
            description="Main backup power generator."
        )

        db.add_all([m204, m101, m305])
        db.commit()

        # 2. Generate Telemetry Records (Deterministic time series)
        telemetry_items = []
        for i in range(40, -1, -1):
            ts = now - timedelta(minutes=i * 2)

            # M-204 Normal baseline for first 30 points, spike in last 10 points
            if i > 10:
                vib = round(1.8 + (i % 5) * 0.1, 2)
                temp = round(52.0 + (i % 3) * 0.8, 1)
                output = round(99.0 + (i % 3) * 0.5, 1)
                is_anom = False
            else:
                # Spike
                vib = round(4.5 + (10 - i) * 0.35, 2)  # Reaches ~7.8 mm/s
                temp = round(72.0 + (10 - i) * 1.6, 1)  # Reaches ~88°C
                output = round(90.0 - (10 - i) * 2.8, 1)  # Drops to ~62 units/min
                is_anom = True

            telemetry_items.append(
                TelemetryRecord(
                    machine_id="M-204",
                    timestamp=ts,
                    vibration_mm_s=vib,
                    temp_celsius=temp,
                    output_units_min=output,
                    is_anomaly=is_anom
                )
            )

            # M-101 (Normal)
            telemetry_items.append(
                TelemetryRecord(
                    machine_id="M-101",
                    timestamp=ts,
                    vibration_mm_s=round(1.2 + (i % 4) * 0.05, 2),
                    temp_celsius=round(44.0 + (i % 3) * 0.4, 1),
                    output_units_min=round(150.0 + (i % 2) * 0.2, 1),
                    is_anomaly=False
                )
            )

            # M-305 (Normal)
            telemetry_items.append(
                TelemetryRecord(
                    machine_id="M-305",
                    timestamp=ts,
                    vibration_mm_s=round(0.8 + (i % 3) * 0.04, 2),
                    temp_celsius=round(61.0 + (i % 4) * 0.3, 1),
                    output_units_min=round(500.0 + (i % 5) * 0.5, 1),
                    is_anomaly=False
                )
            )

        db.add_all(telemetry_items)
        db.commit()

        # 3. Create Maintenance Records
        maint1 = MaintenanceRecord(
            id="MNT-882",
            machine_id="M-204",
            timestamp=now - timedelta(days=420),  # 14 months ago
            component="Main Drive Bearing M-204-B",
            action_taken="Bearing Replacement & Synthetic Lubrication Flush",
            technician="Senior Tech R. Vance",
            notes="Replaced drive bearing M-204-B. Manufacturer specified lifetime: 12 months max under heavy production load."
        )

        maint2 = MaintenanceRecord(
            id="MNT-741",
            machine_id="M-204",
            timestamp=now - timedelta(days=180),
            component="Hydraulic Pressure Sensor",
            action_taken="Routine Sensor Calibration & Fluid Topping",
            technician="Tech A. Gupta",
            notes="Calibrated pressure transducers. Fluid levels verified clean."
        )

        maint3 = MaintenanceRecord(
            id="MNT-610",
            machine_id="M-101",
            timestamp=now - timedelta(days=60),
            component="Impeller Seal",
            action_taken="Seal Tightening & Flange Inspection",
            technician="Tech K. Chen",
            notes="No sign of fluid leakage or mechanical wear."
        )

        db.add_all([maint1, maint2, maint3])
        db.commit()

        # 4. Create SOP Documents
        sop_bearing = SOPDocument(
            id="SOP-M204-BEARING",
            sop_code="SOP-M204-BEARING",
            title="Hydraulic Drive Bearing Degradation Response Procedure",
            target_component="Drive Bearing M-204-B",
            content_markdown="""# SOP-M204-BEARING: Drive Bearing Emergency Response

## 1. Initial Isolation & Safety
- **Step 1.1**: Immediately throttle down hydraulic drive load on Machine M-204 to under 25% capacity.
- **Step 1.2**: Engage secondary cooling auxiliary loop to prevent thermal warping of drive housing.

## 2. Containment & Temporary Mitigation
- **Step 2.1**: Inject high-viscosity synthetic lubricant flush `#LUB-SYN-900` into bearing chamber B.
- **Step 2.2**: Monitor vibration spectrum; ensure RMS amplitude drops below 3.0 mm/s.

## 3. Component Replacement Protocol
- **Step 3.1**: Lockout/Tagout (LOTO) hydraulic power feed `HYD-PWR-04`.
- **Step 3.2**: Replace bearing assembly with spare unit `#BRG-M204-SPARE`.
- **Step 3.3**: Re-align drive shaft and execute 15-minute zero-load spin up test.
"""
        )

        sop_cooling = SOPDocument(
            id="SOP-COOLING-PUMP",
            sop_code="SOP-COOLING-PUMP",
            title="Centrifugal Coolant Pump Pressure Drop Emergency Procedure",
            target_component="Impeller Assembly",
            content_markdown="""# SOP-COOLING-PUMP: Coolant Pressure Loss Response
- **Step 1**: Switch loop circulation to backup pump B-102.
- **Step 2**: Inspect intake strainer for debris blockages.
- **Step 3**: Re-establish pressure differential across primary heat exchanger.
"""
        )

        sop_power = SOPDocument(
            id="SOP-POWER-GEN",
            sop_code="SOP-POWER-GEN",
            title="Turbine Power Generator Voltage Instability Protocol",
            target_component="Stator & Exciter Assembly",
            content_markdown="""# SOP-POWER-GEN: Generator Voltage Protocol
- **Step 1**: Verify automatic voltage regulator (AVR) setpoint.
- **Step 2**: Inspect exciter brush contact points.
"""
        )

        db.add_all([sop_bearing, sop_cooling, sop_power])
        db.commit()

        # 5. Create Active Incident for Machine M-204
        inc_m204 = Incident(
            id="INC-M204-001",
            machine_id="M-204",
            title="Machine M-204 Hydraulic Drive Bearing Degradation",
            severity="CRITICAL",
            status="PENDING_APPROVAL",
            summary="Abnormal vibration spike (7.8 mm/s) and bearing overheating (88°C) detected on Machine M-204. Correlated with historical maintenance record MNT-882 indicating bearing lifetime exceeded by 2 months."
        )

        db.add(inc_m204)
        db.commit()

        # 6. Create Evidence Items for Incident
        evi1 = Evidence(
            id="EVI-M204-01",
            incident_id="INC-M204-001",
            title="Telemetry Anomaly: High Vibration & Overheating Spike",
            description="Vibration amplitude increased from 1.8 mm/s baseline to 7.8 mm/s (+212%). Bearing temperature elevated from 52°C to 88°C (+33°C).",
            source_type="TELEMETRY_CORRELATION",
            confidence_score=94.5
        )

        evi2 = Evidence(
            id="EVI-M204-02",
            incident_id="INC-M204-001",
            title="Maintenance Record Lifespan Exceeded",
            description="Maintenance Log #MNT-882 records last bearing replacement 14 months ago. Manufacturer rated maximum operational lifetime is 12 months.",
            source_type="MAINTENANCE_LOG",
            confidence_score=91.0
        )

        db.add_all([evi1, evi2])
        db.commit()

        # 7. Create Action Recommendation for Incident
        act1 = ActionRecommendation(
            id="ACT-M204-01",
            incident_id="INC-M204-001",
            sop_id="SOP-M204-BEARING",
            action_title="Disengage Hydraulic Load & Execute Auxiliary Lubricant Injection",
            description="Step 1: Reduce M-204 hydraulic motor load to 20%. Step 2: Inject auxiliary lubricant flush. Step 3: Dispatch emergency replacement team with spare unit #BRG-M204-SPARE.",
            priority="CRITICAL",
            human_approved=False
        )

        db.add(act1)
        db.commit()

        print("Database initialized and seeded successfully with synthetic industrial data.")
    finally:
        db.close()


if __name__ == "__main__":
    seed_database()
