import { DerivedMetrics } from "@/lib/types/canonical";
import { DeltaValue, deltaValue } from "./metrics";

export type EvidenceSlot = {
  id: "E1" | "E2" | "E3";
  title: string;
  metricLabel: string;
  value: DeltaValue;
};

type EvidenceInput = {
  current: DerivedMetrics;
  previous: DerivedMetrics;
};

export const buildEvidenceSlots = ({
  current,
  previous,
}: EvidenceInput): EvidenceSlot[] => {
  const useRoas = current.roas !== null && current.roas !== undefined;
  const e1Value = useRoas
    ? deltaValue(current.roas ?? null, previous.roas ?? null)
    : deltaValue(current.costPerResult ?? null, previous.costPerResult ?? null);

  const useConversion =
    current.conversionRate !== null && current.conversionRate !== undefined;
  const e2Value = useConversion
    ? deltaValue(
        current.conversionRate ?? null,
        previous.conversionRate ?? null,
      )
    : deltaValue(current.ctr ?? null, previous.ctr ?? null);

  const useFrequency =
    current.frequency !== null && current.frequency !== undefined;
  const e3Value = useFrequency
    ? deltaValue(current.frequency ?? null, previous.frequency ?? null)
    : deltaValue(current.ctr ?? null, previous.ctr ?? null);

  return [
    {
      id: "E1",
      title: useRoas ? "ผลตอบแทนโฆษณา (ROAS)" : "ต้นทุนต่อผลลัพธ์ (CPR)",
      metricLabel: useRoas ? "ROAS" : "Cost per Result",
      value: e1Value,
    },
    {
      id: "E2",
      title: "คุณภาพทราฟฟิก (Traffic Quality)",
      metricLabel: useConversion ? "Conversion Rate" : "CTR",
      value: e2Value,
    },
    {
      id: "E3",
      title: "ครีเอทีฟเริ่มล้า (Creative Fatigue)",
      metricLabel: useFrequency ? "Frequency" : "CTR Trend",
      value: e3Value,
    },
  ];
};
