import { createHash } from "node:crypto";

export const EVIDENCE_IMAGE_MAX_BYTES = 4 * 1024 * 1024;

export type AllowedEvidenceMime = "image/jpeg" | "image/png" | "image/webp";

const JPEG = Buffer.from([0xff, 0xd8, 0xff]);
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const WEBP_RIFF = Buffer.from("RIFF");
const WEBP_WEBP = Buffer.from("WEBP");

export function detectImageMime(buffer: Buffer): AllowedEvidenceMime | null {
  if (buffer.length >= 3 && buffer.subarray(0, 3).equals(JPEG.subarray(0, 3))) {
    return "image/jpeg";
  }
  if (buffer.length >= 8 && buffer.subarray(0, 8).equals(PNG)) {
    return "image/png";
  }
  if (
    buffer.length >= 12 &&
    buffer.subarray(0, 4).equals(WEBP_RIFF) &&
    buffer.subarray(8, 12).equals(WEBP_WEBP)
  ) {
    return "image/webp";
  }
  return null;
}

export type ImageValidationResult =
  | { ok: true; mime: AllowedEvidenceMime; hash: string }
  | { ok: false; error: string };

export function validateEvidenceImageBuffer(buffer: Buffer): ImageValidationResult {
  if (buffer.length === 0) {
    return { ok: false, error: "empty_file" };
  }
  if (buffer.length > EVIDENCE_IMAGE_MAX_BYTES) {
    return { ok: false, error: "file_too_large" };
  }
  const mime = detectImageMime(buffer);
  if (!mime) {
    return { ok: false, error: "unsupported_type" };
  }
  const hash = createHash("sha256").update(buffer).digest("hex");
  return { ok: true, mime, hash };
}
