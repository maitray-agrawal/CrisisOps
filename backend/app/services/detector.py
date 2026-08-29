from typing import List
from pydantic import BaseModel


class AnomalyDetail(BaseModel):
    is_anomaly: bool
    signal_name: str
    observed_value: float
    expected_threshold: float
    severity: str  # WARNING, CRITICAL
    explanation: str


class DetectionSummary(BaseModel):
    is_anomaly: bool
    highest_severity: str  # NORMAL, WARNING, ANOMALOUS, CRITICAL
    anomalies: List[AnomalyDetail]
    explanation: str


class AnomalyDetector:
    """Deterministic, transparent industrial telemetry anomaly detector."""

    # Threshold constants
    VIBRATION_WARNING = 2.5  # mm/s
    VIBRATION_CRITICAL = 4.5  # mm/s
    TEMP_WARNING = 75.0  # °C
    TEMP_CRITICAL = 85.0  # °C
    OUTPUT_BASELINE = 100.0  # nominal units/min
    OUTPUT_DROP_WARNING_THRESHOLD = 70.0  # 30% drop (70 units/min)
    OUTPUT_DROP_CRITICAL_THRESHOLD = 60.0  # 40% drop (60 units/min)

    @classmethod
    def evaluate_telemetry(
        cls,
        vibration_mm_s: float,
        temp_celsius: float,
        output_units_min: float
    ) -> DetectionSummary:
        """Evaluate a single telemetry reading against explainable industrial thresholds."""
        anomalies: List[AnomalyDetail] = []

        # 1. Vibration evaluation
        if vibration_mm_s >= cls.VIBRATION_CRITICAL:
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Vibration Amplitude",
                    observed_value=round(vibration_mm_s, 2),
                    expected_threshold=cls.VIBRATION_CRITICAL,
                    severity="CRITICAL",
                    explanation=f"Vibration level ({vibration_mm_s:.2f} mm/s) breached critical threshold ({cls.VIBRATION_CRITICAL} mm/s)."
                )
            )
        elif vibration_mm_s >= cls.VIBRATION_WARNING:
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Vibration Amplitude",
                    observed_value=round(vibration_mm_s, 2),
                    expected_threshold=cls.VIBRATION_WARNING,
                    severity="WARNING",
                    explanation=f"Vibration level ({vibration_mm_s:.2f} mm/s) exceeded warning threshold ({cls.VIBRATION_WARNING} mm/s)."
                )
            )

        # 2. Temperature evaluation
        if temp_celsius >= cls.TEMP_CRITICAL:
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Bearing Temperature",
                    observed_value=round(temp_celsius, 1),
                    expected_threshold=cls.TEMP_CRITICAL,
                    severity="CRITICAL",
                    explanation=f"Bearing temperature ({temp_celsius:.1f} °C) breached critical thermal threshold ({cls.TEMP_CRITICAL} °C)."
                )
            )
        elif temp_celsius >= cls.TEMP_WARNING:
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Bearing Temperature",
                    observed_value=round(temp_celsius, 1),
                    expected_threshold=cls.TEMP_WARNING,
                    severity="WARNING",
                    explanation=f"Bearing temperature ({temp_celsius:.1f} °C) exceeded thermal warning threshold ({cls.TEMP_WARNING} °C)."
                )
            )

        # 3. Output rate degradation evaluation
        if output_units_min <= cls.OUTPUT_DROP_CRITICAL_THRESHOLD:
            drop_pct = round(((cls.OUTPUT_BASELINE - output_units_min) / cls.OUTPUT_BASELINE) * 100, 1)
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Production Output Rate",
                    observed_value=round(output_units_min, 1),
                    expected_threshold=cls.OUTPUT_DROP_CRITICAL_THRESHOLD,
                    severity="CRITICAL",
                    explanation=f"Output rate ({output_units_min:.1f} units/min) suffered severe degradation (-{drop_pct}% vs baseline)."
                )
            )
        elif output_units_min <= cls.OUTPUT_DROP_WARNING_THRESHOLD:
            drop_pct = round(((cls.OUTPUT_BASELINE - output_units_min) / cls.OUTPUT_BASELINE) * 100, 1)
            anomalies.append(
                AnomalyDetail(
                    is_anomaly=True,
                    signal_name="Production Output Rate",
                    observed_value=round(output_units_min, 1),
                    expected_threshold=cls.OUTPUT_DROP_WARNING_THRESHOLD,
                    severity="WARNING",
                    explanation=f"Output rate ({output_units_min:.1f} units/min) dropped >30% below nominal (-{drop_pct}% vs baseline)."
                )
            )

        if not anomalies:
            return DetectionSummary(
                is_anomaly=False,
                highest_severity="NORMAL",
                anomalies=[],
                explanation="All telemetry metrics within normal operating bounds."
            )

        has_critical = any(a.severity == "CRITICAL" for a in anomalies)
        num_anomalies = len(anomalies)

        if has_critical or num_anomalies >= 2:
            highest_severity = "CRITICAL"
        elif num_anomalies == 1 and anomalies[0].severity == "WARNING":
            highest_severity = "WARNING"
        else:
            highest_severity = "ANOMALOUS"

        exp_lines = [a.explanation for a in anomalies]
        return DetectionSummary(
            is_anomaly=True,
            highest_severity=highest_severity,
            anomalies=anomalies,
            explanation="; ".join(exp_lines)
        )
