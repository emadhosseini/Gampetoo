import { useState } from "react";
import { Navigate, useParams } from "react-router-dom";

import StatChartPage from "@/components/progress/StatChartPage";
import BodyMeasurementModal from "@/components/progress/BodyMeasurementModal";
import {
  MEASUREMENT_COLORS,
  MEASUREMENT_LABELS,
  MEASUREMENT_TYPES,
  getHistoryFor,
  type MeasurementType,
} from "@/utils/bodyMeasurementsEngine";

function isMeasurementType(value: string | undefined): value is MeasurementType {
  return MEASUREMENT_TYPES.includes(value as MeasurementType);
}

// One instance of this page per metric (route :type), same as
// WeightDetailPage but simpler — no target line or BMI card, just the
// trend chart and an add button, since a body measurement has no goal
// value of its own the way weight does.
export default function BodyMeasurementDetailPage() {
  const { type } = useParams<{ type: string }>();
  const [modalOpen, setModalOpen] = useState(false);
  const [, setVersion] = useState(0);

  if (!isMeasurementType(type)) {
    return <Navigate to="/progress/body-measurements" replace />;
  }

  const history = getHistoryFor(type);

  return (
    <>
      <StatChartPage
        title={MEASUREMENT_LABELS[type]}
        unitLabel="سانتی‌متر"
        color={MEASUREMENT_COLORS[type]}
        minYStep={1}
        valuePrecision={1}
        history={history}
        onAdd={() => setModalOpen(true)}
        addLabel={`افزودن ${MEASUREMENT_LABELS[type]}`}
        defaultRange="month"
        availableRanges={["month", "sixMonth", "year"]}
        summaryLabels={{
          day: "مقدار فعلی",
          daily: "میانگین روزانه",
          monthly: "میانگین ماهیانه",
        }}
      />

      <BodyMeasurementModal
        type={type}
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSaved={() => setVersion((v) => v + 1)}
      />
    </>
  );
}
