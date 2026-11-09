import { describe, expect, it } from "bun:test";
import { sanitizeThrowPower } from "../../apps/web/src/store/gameStore";

describe("Security Suite: Client Input Sanitization & Vector Injection Defense", () => {
  it("MENANGANI dan menetralkan nilai NaN pada rasio daya lemparan", () => {
    const sanitized = sanitizeThrowPower(NaN);
    expect(sanitized).toBe(0.1);
    expect(isNaN(sanitized)).toBe(false);
  });

  it("MENANGANI dan menetralkan nilai Infinity dan -Infinity", () => {
    const posInf = sanitizeThrowPower(Infinity);
    expect(posInf).toBe(0.1);

    const negInf = sanitizeThrowPower(-Infinity);
    expect(negInf).toBe(0.1);
  });

  it("MENAHAN rasio daya yang dimanipulasi melebihi 100% (Cap: 1.0)", () => {
    // Eksploitasi: Klien mengirim power 99.9x
    const spoofedPower = 99.9;
    const sanitized = sanitizeThrowPower(spoofedPower);
    expect(sanitized).toBe(1.0);
  });

  it("MENAHAN rasio daya negatif atau mendekati nol ke batas bawah aman (0.05)", () => {
    const negativePower = -5.0;
    const sanitized = sanitizeThrowPower(negativePower);
    expect(sanitized).toBe(0.05);

    const zeroPower = 0.0;
    const sanitizedZero = sanitizeThrowPower(zeroPower);
    expect(sanitizedZero).toBe(0.05);
  });

  it("MEMBATASI presisi floating point maksimum 3 desimal untuk mencegah precision-overflow", () => {
    const rawPower = 0.55555555555;
    const sanitized = sanitizeThrowPower(rawPower);
    expect(sanitized).toBe(0.556);
  });
});
