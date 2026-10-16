// Constructor drafts in the address: the codec keeps Cyrillic and line breaks, the parsers
// accept what the constructors write and turn anything else into «no draft».

import { describe, expect, it } from "vitest";
import { decodeDraft, encodeDraft, MAX_DRAFT_LENGTH } from "@/lib/draft/draft-codec";
import { parseKonstruktorDraft } from "@/lib/draft/konstruktor-draft";
import { parseBusinessSignDraft } from "@/lib/draft/business-sign-draft";
import { MATERIALS as ALL } from "@/lib/materials";
import type { BusinessSignDraft, KonstruktorDraft } from "@/types/draft";

const MATERIALS = { stencil: ["pet_thin", "polystyrene", "acrylic"], weld: ["acrylic_3", "acrylic_mirror_3"] } as const;

const konstruktor: KonstruktorDraft = {
  mode: "stencil", text: "Підʼїзд 3\nОбережно", fontId: "montserrat", widthMm: 900, marginMm: 15, shape: "rect",
  materialId: "acrylic", bridgeStrength: "strong", align: "left", upper: true, lineFontIds: ["", "custom:ab12"],
  byLetter: false, letterMm: 100,
  weld: { widthMm: 200, materialId: "acrylic_mirror_3", colourId: "", overlapShare: 0.04, baseline: true, outline: false, skewers: 2, skewerLengthMm: 120 },
};

const sign: BusinessSignDraft = {
  shape: "circle", widthMm: 500, heightMm: 500, direction: 1, baseMaterialId: "black", baseThicknessMm: 3,
  lines: [{ text: "Мрія", fontId: "marck", size: 1.6, materialId: "mirror-gold" }, { text: "САЛОН КРАСИ", fontId: "montserrat", size: 0.6, materialId: "white" }],
  arc: { top: "СТУДІЯ", bottom: "КИЇВ", fontId: "pt-serif", materialId: "mirror-gold" },
  frameMaterialId: "mirror-gold", holes: 2, selfAdhesive: false, positioningStencil: true, logoDevelopment: true,
  logoBrief: "Квітка лотоса", quantity: 2,
};

describe("draft codec", () => {
  it("round-trips Cyrillic text and line breaks through a URL-safe value", () => {
    const encoded = encodeDraft(konstruktor);
    expect(encoded).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(decodeDraft(encoded)).toEqual(konstruktor);
  });

  it("gives null for damaged or oversized values", () => {
    expect(decodeDraft("")).toBeNull();
    expect(decodeDraft("not base64!")).toBeNull();
    expect(decodeDraft(encodeDraft(konstruktor).slice(0, 20))).toBeNull();
    expect(decodeDraft("A".repeat(MAX_DRAFT_LENGTH + 1))).toBeNull();
  });
});

describe("parseKonstruktorDraft", () => {
  const colour = (id: string) => ({ ...konstruktor, weld: { ...konstruktor.weld, colourId: id } });

  it("accepts a draft the constructor wrote", () => {
    const draft = colour(ALL.acrylic_mirror_3.colours[0].id);
    expect(parseKonstruktorDraft(draft, MATERIALS)).toEqual(draft);
  });

  it("keeps numbers within the constructor's ranges", () => {
    const draft = { ...colour(ALL.acrylic_mirror_3.colours[0].id), widthMm: 99999, letterMm: -5 };
    expect(parseKonstruktorDraft(draft, MATERIALS)).toMatchObject({ widthMm: 4000, letterMm: 10 });
  });

  it("refuses unknown materials, colours, fonts and empty text", () => {
    const good = colour(ALL.acrylic_mirror_3.colours[0].id);
    expect(parseKonstruktorDraft({ ...good, materialId: "acrylic_3" }, MATERIALS)).toBeNull();
    expect(parseKonstruktorDraft(colour("no-such-colour"), MATERIALS)).toBeNull();
    expect(parseKonstruktorDraft({ ...good, fontId: "<script>" }, MATERIALS)).toBeNull();
    expect(parseKonstruktorDraft({ ...good, text: "   " }, MATERIALS)).toBeNull();
    expect(parseKonstruktorDraft(null, MATERIALS)).toBeNull();
  });
});

describe("parseBusinessSignDraft", () => {
  it("accepts a draft the constructor wrote", () => {
    expect(parseBusinessSignDraft(sign)).toEqual(sign);
  });

  it("refuses unknown sheets, shapes and too many lines", () => {
    expect(parseBusinessSignDraft({ ...sign, baseMaterialId: "gold-leaf" })).toBeNull();
    expect(parseBusinessSignDraft({ ...sign, shape: "star" })).toBeNull();
    expect(parseBusinessSignDraft({ ...sign, lines: Array(5).fill(sign.lines[0]) })).toBeNull();
    expect(parseBusinessSignDraft({ ...sign, lines: [] })).toBeNull();
  });

  it("keeps the size within the constructor's limits", () => {
    expect(parseBusinessSignDraft({ ...sign, widthMm: 5, heightMm: 99999 })).toMatchObject({ widthMm: 100, heightMm: 3000 });
  });
});
