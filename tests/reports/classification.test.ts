import { describe, expect, it } from "vitest";
import { parseClassification, reportClassificationSchema } from "@/lib/services/reports/classification";
import { UnavailableClassifier } from "@/lib/services/reports/classifier";

const valid = {
  category: "infraestructura",
  place: "Sala B-21",
  severity: 2,
  summary: "Enchufes sin funcionar",
  missingInfo: false,
};

describe("reportClassificationSchema", () => {
  it("accepts a valid classification", () => {
    expect(reportClassificationSchema.parse(valid)).toEqual(valid);
    expect(parseClassification({ ...valid, place: null })).toEqual({ ...valid, place: null });
  });

  it("rejects severity out of range", () => {
    expect(parseClassification({ ...valid, severity: 0 })).toBeNull();
    expect(parseClassification({ ...valid, severity: 4 })).toBeNull();
    expect(parseClassification({ ...valid, severity: 2.5 })).toBeNull();
  });

  it("rejects missing or unknown fields", () => {
    const { summary: _summary, ...withoutSummary } = valid;
    void _summary;
    expect(parseClassification(withoutSummary)).toBeNull();
    expect(parseClassification({ ...valid, category: "hackeo" })).toBeNull();
    expect(parseClassification("not json")).toBeNull();
    expect(parseClassification(null)).toBeNull();
  });
});

describe("UnavailableClassifier", () => {
  it("always returns null so reports stay 'sin clasificar'", async () => {
    await expect(new UnavailableClassifier().classify("texto")).resolves.toBeNull();
  });
});
