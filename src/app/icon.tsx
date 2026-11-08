import { ImageResponse } from "next/og";

export const runtime = "edge";
export const size = { width: 512, height: 512 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "linear-gradient(135deg, #020617 0%, #0f172a 60%, #1e1b4b 100%)",
        borderRadius: "112px",
        border: "12px solid #1e293b",
      }}
    >
      {/* Alan Walker-inspired sharp interlocking geometric monogram */}
      <svg
        width="360"
        height="360"
        viewBox="0 0 100 100"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer cyber-hex shield */}
        <polygon
          points="50,5 92,27 92,73 50,95 8,73 8,27"
          stroke="#10b981"
          strokeWidth="3.5"
          strokeOpacity="0.4"
          fill="none"
        />
        {/* Angular 'A/E' slash blades */}
        <path
          d="M24 76 L50 18 L76 76"
          stroke="#38bdf8"
          strokeWidth="8"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Interlocking 'W/T' inverted geometric blade */}
        <path
          d="M22 36 L38 72 L50 46 L62 72 L78 36"
          stroke="#10b981"
          strokeWidth="7.5"
          strokeLinecap="square"
          strokeLinejoin="miter"
        />
        {/* Center crossbar */}
        <line
          x1="34"
          y1="54"
          x2="66"
          y2="54"
          stroke="#f8fafc"
          strokeWidth="5"
        />
      </svg>
    </div>,
    { ...size },
  );
}
