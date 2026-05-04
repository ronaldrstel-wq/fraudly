import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "Fraudly – scam checker and fraud detection tool";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #2563eb 0%, #7c3aed 100%)",
          color: "#fff",
          padding: 48
        }}
      >
        <div style={{ fontSize: 68, fontWeight: 800, letterSpacing: "-0.03em" }}>Fraudly</div>
        <div style={{ fontSize: 26, marginTop: 20, opacity: 0.95, textAlign: "center", maxWidth: 900 }}>
          Scam checker & fraud detection for websites and links
        </div>
      </div>
    ),
    { ...size }
  );
}
