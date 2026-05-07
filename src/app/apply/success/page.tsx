"use client";

import { useEffect, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

// ── Confetti particle type ────────────────────────────────────────────────────
interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  rotation: number;
  rotationSpeed: number;
  opacity: number;
  shape: "rect" | "circle";
}

const BRAND_COLORS = [
  "#00A6B8", // brand-500
  "#33CCDA", // brand-400
  "#66D9E3", // brand-300
  "#008A9B", // brand-600
  "#C0F0F4", // brand-100
  "#12b76a", // success
  "#00535E", // brand-800
];

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<Particle[]>([]);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    // Spawn particles
    for (let i = 0; i < 120; i++) {
      particles.current.push({
        x: Math.random() * canvas.width,
        y: -20 - Math.random() * 200,
        vx: (Math.random() - 0.5) * 3,
        vy: 1.5 + Math.random() * 3,
        color: BRAND_COLORS[Math.floor(Math.random() * BRAND_COLORS.length)],
        size: 6 + Math.random() * 8,
        rotation: Math.random() * 360,
        rotationSpeed: (Math.random() - 0.5) * 6,
        opacity: 0.85 + Math.random() * 0.15,
        shape: Math.random() > 0.5 ? "rect" : "circle",
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.current.forEach((p, idx) => {
        p.x += p.vx;
        p.y += p.vy;
        p.rotation += p.rotationSpeed;
        p.vy += 0.05; // gravity

        // fade out near bottom
        if (p.y > canvas.height * 0.75) {
          p.opacity -= 0.012;
        }

        if (p.opacity <= 0 || p.y > canvas.height + 30) {
          // Recycle
          particles.current[idx] = {
            ...p,
            x: Math.random() * canvas.width,
            y: -20,
            vy: 1.5 + Math.random() * 2,
            opacity: 0.85,
          };
          return;
        }

        ctx.save();
        ctx.globalAlpha = Math.max(0, p.opacity);
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.fillStyle = p.color;

        if (p.shape === "circle") {
          ctx.beginPath();
          ctx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
          ctx.fill();
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        }

        ctx.restore();
      });

      animRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="pointer-events-none fixed inset-0 z-0"
      aria-hidden="true"
    />
  );
}

// ── Animated checkmark SVG ────────────────────────────────────────────────────
function AnimatedCheck() {
  return (
    <div className="relative flex items-center justify-center">
      {/* Pulse rings */}
      <span className="absolute inline-flex h-32 w-32 animate-ping rounded-full bg-brand-400/20" />
      <span
        className="absolute inline-flex h-24 w-24 animate-ping rounded-full bg-brand-500/25"
        style={{ animationDelay: "0.2s" }}
      />

      {/* Circle container */}
      <div className="relative z-10 flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-brand-400 to-brand-700 shadow-2xl shadow-brand-500/40">
        {/* Inner shimmer */}
        <div className="absolute inset-1 rounded-full bg-gradient-to-tr from-white/10 to-transparent" />

        {/* Checkmark SVG */}
        <svg
          viewBox="0 0 52 52"
          className="h-14 w-14 drop-shadow-lg"
          style={{ filter: "drop-shadow(0 0 8px rgba(255,255,255,0.5))" }}
        >
          <circle
            cx="26"
            cy="26"
            r="25"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1"
          />
          <path
            fill="none"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="80"
            strokeDashoffset="80"
            d="M14 27 l 9 9 l 16 -18"
            style={{
              animation: "drawCheck 0.6s 0.3s ease forwards",
            }}
          />
        </svg>
      </div>
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-brand-100/50 bg-brand-50/60 px-4 py-3 text-sm text-gray-700 dark:border-brand-900/40 dark:bg-brand-950/30 dark:text-gray-300">
      <span className="mt-0.5 shrink-0 text-brand-500">{icon}</span>
      <span>{text}</span>
    </div>
  );
}

// ── Main inner component (uses searchParams) ──────────────────────────────────
function SuccessPageInner() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const [visible, setVisible] = useState(false);
  const [countdown, setCountdown] = useState(10);

  // Entrance animation
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) {
      router.push("/careers");
      return;
    }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  const referenceId = token ? token.slice(0, 12).toUpperCase() : "—";

  return (
    <div className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-gray-50 px-4 py-16 dark:bg-gray-950">
      {/* Confetti */}
      <ConfettiCanvas />

      {/* Background glow blobs */}
      <div
        className="pointer-events-none absolute -top-40 left-1/2 -translate-x-1/2 h-[500px] w-[500px] rounded-full opacity-20 blur-3xl"
        style={{
          background: "radial-gradient(circle, #00A6B8 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-0 right-0 h-[350px] w-[350px] rounded-full opacity-10 blur-3xl"
        style={{
          background: "radial-gradient(circle, #33CCDA 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-lg transition-all duration-700"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible
            ? "translateY(0) scale(1)"
            : "translateY(24px) scale(0.97)",
        }}
      >
        {/* Glass card */}
        <div className="rounded-3xl border border-white/60 bg-white/90 p-8 shadow-2xl backdrop-blur-sm dark:border-white/10 dark:bg-gray-900/90 sm:p-10">
          {/* Animated check */}
          <div className="mb-8 flex justify-center">
            <AnimatedCheck />
          </div>

          {/* Heading */}
          <div className="mb-6 text-center">
            <h1 className="mb-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-4xl">
              Application{" "}
              <span className="bg-gradient-to-r from-brand-500 to-brand-300 bg-clip-text text-transparent">
                Submitted!
              </span>
            </h1>
            <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
              Thank you for applying. Your candidate application has been
              successfully received and is now under review.
            </p>
          </div>

          {/* Reference ID */}
          {token && (
            <div className="mb-6 flex items-center justify-between rounded-2xl border border-brand-200 bg-brand-50 px-5 py-3.5 dark:border-brand-800/50 dark:bg-brand-950/40">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
                  Reference ID
                </p>
                <p className="mt-0.5 font-mono text-lg font-bold text-gray-900 dark:text-white">
                  {referenceId}
                </p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-100 dark:bg-brand-900/50">
                <svg
                  className="h-5 w-5 text-brand-600 dark:text-brand-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
            </div>
          )}

          {/* Info rows */}
          <div className="mb-8 space-y-3">
            <InfoRow
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              }
              text="Your application is now in review. Our team will assess your profile and reach out if you are shortlisted."
            />
            <InfoRow
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              }
              text="Keep an eye on the email you provided. Any updates or communications will be sent there."
            />
            <InfoRow
              icon={
                <svg
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
              }
              text="You can still log in to the careers portal to update your application or upload additional documents."
            />
          </div>

          {/* Action buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link
              href="/careers"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-brand-500 to-brand-600 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/30 transition hover:from-brand-600 hover:to-brand-700 hover:shadow-brand-600/40 active:scale-[0.98]"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
              Browse More Jobs
            </Link>
            <Link
              href="/careers/applications"
              className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 py-3.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 hover:border-gray-300 active:scale-[0.98] dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-750"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                />
              </svg>
              My Applications
            </Link>
          </div>

          {/* Auto-redirect notice */}
          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-600">
            Redirecting to job listings in{" "}
            <span className="font-semibold tabular-nums text-brand-500">
              {countdown}s
            </span>
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="mt-5 text-center text-xs text-gray-400 dark:text-gray-600">
          Parkora Maritime · Application Portal
        </div>
      </div>

      {/* CSS keyframes injected as a style tag */}
      <style>{`
        @keyframes drawCheck {
          to { stroke-dashoffset: 0; }
        }
      `}</style>
    </div>
  );
}

// ── Page export (wrapped in Suspense for useSearchParams) ─────────────────────
export default function ApplicationSuccessPage() {
  return (
    <Suspense>
      <SuccessPageInner />
    </Suspense>
  );
}
