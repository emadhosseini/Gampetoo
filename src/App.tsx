import { useEffect, useState, useSyncExternalStore } from "react";
import appScreenshot from "@/imports/app-screenshot.webp";
import gampetooLogo from "@/imports/gampetoo-logo.png";

// ─── Responsive hook ──────────────────────────────────────────────────────────
// A single shared width store instead of each component keeping its own
// resize listener — six+ call sites across this file previously meant six+
// separate window.addEventListener("resize", ...) registrations, all firing
// (and re-rendering their whole subtree) on every resize event, which on
// mobile fires repeatedly as the browser chrome shows/hides while
// scrolling. rAF-throttled so a drag-resize can't fire faster than a frame,
// and useSyncExternalStore means every useW() call site shares this one
// listener instead of adding its own.

let sharedWidth = typeof window !== "undefined" ? window.innerWidth : 1200;
const widthListeners = new Set<() => void>();
let resizeRafId: number | null = null;

function handleWindowResize() {
  if (resizeRafId !== null) return;

  resizeRafId = requestAnimationFrame(() => {
    resizeRafId = null;
    sharedWidth = window.innerWidth;
    widthListeners.forEach((listener) => listener());
  });
}

if (typeof window !== "undefined") {
  window.addEventListener("resize", handleWindowResize);
}

function subscribeToWidth(listener: () => void) {
  widthListeners.add(listener);
  return () => widthListeners.delete(listener);
}

function getWidthSnapshot() {
  return sharedWidth;
}

function useW() {
  return useSyncExternalStore(subscribeToWidth, getWidthSnapshot);
}

// ─── Icons ────────────────────────────────────────────────────────────────────

const F = { family: "'Vazirmatn', sans-serif" };

function IconDumbbell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6.5 6.5h11M6.5 17.5h11M3 9.5v5M21 9.5v5M6 6v12M18 6v12"/>
    </svg>
  );
}
function IconFork() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 11v13M17 2v13M14 2s1 2 1 4.5a2.5 2.5 0 0 0 5 0C20 4 21 2 21 2"/>
    </svg>
  );
}
function IconTrendUp() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>
    </svg>
  );
}
function IconScale() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20V12M12 12 6 6M12 12l6-6M3 20h18"/>
    </svg>
  );
}
function IconBarChart() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="12" width="4" height="8" rx="1"/><rect x="10" y="6" width="4" height="14" rx="1"/><rect x="17" y="3" width="4" height="17" rx="1"/>
    </svg>
  );
}
function IconBell() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <img src={gampetooLogo} alt="Gampetoo" style={{ width: 38, height: 38, objectFit: "contain", flexShrink: 0 }}/>
      <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F5F7", letterSpacing: "-0.02em" }}>Gampetoo</span>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

function Nav() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    let rafId: number | null = null;

    const fn = () => {
      if (rafId !== null) return;

      rafId = requestAnimationFrame(() => {
        rafId = null;
        setScrolled(window.scrollY > 40);
      });
    };

    window.addEventListener("scroll", fn, { passive: true });
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
      transition: "background-color 0.4s, border-color 0.4s",
      backgroundColor: scrolled ? "rgb(0 0 0 / 30%)" : "transparent",
      borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
    }}>
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
        <div style={{ display: "flex", alignItems: "center", height: 60 }}>
          <Logo/>
        </div>
      </div>
    </nav>
  );
}

// ─── Phone Mockup ─────────────────────────────────────────────────────────────

const SCREEN_IDX = { home: 0, workout: 1, progress: 2 };

function PhoneMockup({ screen, width = 200 }: { screen: "home" | "workout" | "progress"; width?: number }) {
  const idx = SCREEN_IDX[screen];
  const height = Math.round(width * 2);

  return (
    <div style={{
      position: "relative", width, height,
      borderRadius: Math.round(width * 0.16),
      background: "linear-gradient(145deg, #1a1a1a, #111)",
      border: "1.5px solid rgba(255,255,255,0.12)",
      overflow: "hidden",
      boxShadow: "0 0 0 1px rgba(255,255,255,0.04), 0 40px 80px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
      flexShrink: 0,
    }}>
      {/* Notch */}
      <div style={{
        position: "absolute", top: Math.round(width * 0.045), left: "50%", transform: "translateX(-50%)",
        width: Math.round(width * 0.36), height: Math.round(width * 0.1),
        background: "#0a0a0a", borderRadius: Math.round(width * 0.05),
        zIndex: 10, boxShadow: "0 0 0 1.5px rgba(255,255,255,0.08)",
      }}/>
      {/* Screenshot crop */}
      <div style={{
        position: "absolute", inset: 0,
        backgroundImage: `url(${appScreenshot})`,
        backgroundSize: "300% auto",
        backgroundPosition: `${idx * 50}% top`,
        backgroundRepeat: "no-repeat",
      }}/>
    </div>
  );
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  const w = useW();
  const isMobile = w < 768;
  const isTablet = w >= 768 && w < 1024;

  const phoneW = isMobile ? 160 : isTablet ? 170 : 200;

  return (
    <section style={{ position: "relative", overflow: "hidden", paddingTop: isMobile ? 80 : 100 }}>
      {/* Ambient blobs */}
      <div className="ambient-blob" style={{ width: isMobile ? 300 : 600, height: isMobile ? 300 : 600, background: "radial-gradient(circle, rgba(59,145,73,0.16) 0%, transparent 70%)", top: -80, right: isMobile ? -80 : -200 }}/>
      <div className="ambient-blob" style={{ width: isMobile ? 220 : 400, height: isMobile ? 220 : 400, background: "radial-gradient(circle, rgba(250,234,92,0.08) 0%, transparent 70%)", bottom: 50, left: -100 }}/>

      <div style={{ maxWidth: 1200, margin: "0 auto", padding: isMobile ? "0 20px" : "0 24px", position: "relative", zIndex: 1 }}>

        {/* ── Mobile layout: text → single phone ── */}
        {isMobile ? (
          <div className="rtl animate-fade-in-up" style={{ animationFillMode: "forwards", opacity: 0, paddingBottom: 60 }}>
            {/* Badge */}
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "rgba(250,234,92,0.1)", border: "1px solid rgba(250,234,92,0.25)", marginBottom: 22 }}>
              <span className="animate-pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: "#faea5c", display: "inline-block" }}/>
              <span style={{ color: "#faea5c", fontSize: 12, fontWeight: 600, ...F }}>نسخه ۲.۰ اکنون در دسترس است</span>
            </div>

            <h1 style={{ fontSize: "clamp(28px, 8vw, 40px)", fontWeight: 800, lineHeight: 1.3, color: "#F5F5F7", letterSpacing: "-0.02em", marginBottom: 16, ...F }}>
              برنامه تمرینی و غذایی<br/>
              <span className="gradient-text">شخصی خودت</span> رو<br/>
              برنامه‌ریزی کن، ثبت کن، پیشرفت کن !
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(245,245,247,0.55)", marginBottom: 28, ...F }}>
              مدیریت برنامه تمرینی و تغذیه شخصی، کالری شماری هوشمند، گزارش پیشرفت و انگیزه روزانه؛ همه در یک اپلیکیشن.
            </p>

            {/* CTA */}
            <div style={{ marginBottom: 40 }}>
              <a href="https://pwa.gampetoo.com" className="btn-primary" style={{ display: "block", width: "100%", textAlign: "center", fontSize: 16, fontWeight: 700, padding: "15px 24px", borderRadius: 14, textDecoration: "none", ...F, boxShadow: "0 8px 32px rgba(250,234,92,0.3)" }}>
                نصب وب‌اپ گامپتو
              </a>
            </div>

            {/* Single centered phone */}
            <div style={{ display: "flex", justifyContent: "center", position: "relative" }}>
              <div className="animate-float" style={{ position: "relative", zIndex: 2 }}>
                <PhoneMockup screen="workout" width={phoneW}/>
              </div>
              {/* Glow */}
              <div style={{ position: "absolute", bottom: -20, left: "50%", transform: "translateX(-50%)", width: 200, height: 60, background: "radial-gradient(ellipse, rgba(250,234,92,0.22) 0%, transparent 70%)", filter: "blur(16px)" }}/>
            </div>
          </div>

        ) : (
          /* ── Tablet / Desktop layout: 2 columns ── */
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "1fr 1fr", gap: isTablet ? 40 : 80, alignItems: "center" }}>
            {/* Text */}
            <div className="rtl animate-fade-in-up" style={{ animationFillMode: "forwards", opacity: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "rgba(250,234,92,0.1)", border: "1px solid rgba(250,234,92,0.25)", marginBottom: 28 }}>
                <span className="animate-pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: "#faea5c", display: "inline-block" }}/>
                <span style={{ color: "#faea5c", fontSize: 13, fontWeight: 600, ...F }}>نسخه ۲.۰ اکنون در دسترس است</span>
              </div>

              <h1 style={{ fontSize: isTablet ? "clamp(28px,4vw,40px)" : "clamp(32px, 4vw, 54px)", fontWeight: 800, lineHeight: 1.25, color: "#F5F5F7", letterSpacing: "-0.02em", marginBottom: 20, ...F }}>
                برنامه تمرینی و غذایی<br/>
                <span className="gradient-text">شخصی خودت</span> رو<br/>
                برنامه‌ریزی کن، ثبت کن، پیشرفت کن !
              </h1>

              <p style={{ fontSize: isTablet ? 15 : 17, lineHeight: 1.7, color: "rgba(245,245,247,0.55)", marginBottom: 36, ...F }}>
                برنامه تمرینی و تغذیه شخصی، کالری شماری هوشمند، گزارش پیشرفت و انگیزه روزانه؛ همه در یک اپلیکیشن.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                <a href="https://pwa.gampetoo.com" className="btn-primary" style={{ display: "inline-block", fontSize: 16, fontWeight: 700, padding: "14px 32px", borderRadius: 14, textDecoration: "none", ...F, boxShadow: "0 8px 32px rgba(250,234,92,0.3)" }}
                >
                 نصب وب‌اپ گامپتو
                </a>
              </div>
            </div>

            {/* Phones — 3 floating */}
            <div style={{ position: "relative", height: isTablet ? 420 : 520, display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div className="animate-float-2" style={{ position: "absolute", right: isTablet ? 0 : 10, top: 20, zIndex: 1, opacity: 0.75 }}>
                <PhoneMockup screen="home" width={phoneW}/>
              </div>
              <div className="animate-float" style={{ position: "absolute", left: "50%", transform: "translateX(-50%)", zIndex: 3 }}>
                <PhoneMockup screen="workout" width={phoneW}/>
              </div>
              <div className="animate-float-3" style={{ position: "absolute", left: isTablet ? 0 : 10, bottom: 20, zIndex: 1, opacity: 0.75 }}>
                <PhoneMockup screen="progress" width={phoneW}/>
              </div>
              <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 300, height: 60, background: "radial-gradient(ellipse, rgba(250,234,92,0.18) 0%, transparent 70%)", filter: "blur(20px)" }}/>
            </div>
          </div>
        )}
      </div>

      {/* Scroll indicator — desktop only */}
      {!isMobile && (
        <div style={{ display: "flex", justifyContent: "center", paddingBottom: 40 }}>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8, opacity: 0.35 }}>
            <div style={{ width: 1, height: 40, background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }}/>
          </div>
        </div>
      )}
    </section>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ badge, title, sub }: { badge: string; title: React.ReactNode; sub?: string }) {
  const w = useW();
  const isMobile = w < 768;
  return (
    <div className="rtl" style={{ textAlign: "center", marginBottom: isMobile ? 40 : 64 }}>
      <div style={{ display: "inline-flex", padding: "5px 14px", borderRadius: 100, background: "rgba(250,234,92,0.08)", border: "1px solid rgba(250,234,92,0.2)", marginBottom: 16 }}>
        <span style={{ color: "#faea5c", fontSize: 12, fontWeight: 600, ...F }}>{badge}</span>
      </div>
      <h2 style={{ fontSize: isMobile ? "clamp(24px,6vw,32px)" : "clamp(28px,3.5vw,44px)", fontWeight: 800, color: "#F5F5F7", letterSpacing: "-0.02em", marginBottom: sub ? 14 : 0, ...F }}>{title}</h2>
      {sub && <p style={{ color: "rgba(245,245,247,0.5)", fontSize: isMobile ? 15 : 17, maxWidth: 480, margin: "0 auto", ...F, lineHeight: 1.7 }}>{sub}</p>}
    </div>
  );
}

// ─── Features ─────────────────────────────────────────────────────────────────

const FEATURES = [
  { icon: <IconDumbbell/>, title: "برنامه روزانه", desc: "تمرین، تغذیه و فعالیت‌های هر روز را در یک صفحه مشاهده و مدیریت کن" },
  { icon: <IconFork/>, title: "برنامه غذایی", desc: "وعده‌های غذایی و برنامه تغذیه شخصی خودت را ثبت و مدیریت کن" },
  { icon: <IconTrendUp/>, title: "برنامه‌های تمرینی", desc: "برنامه‌های تمرینی خودت را وارد کن، و هر روز دقیقاً بدان چه تمرینی در انتظار توست." },
  { icon: <IconScale/>, title: "گزارش‌ها", desc: "آمار تمرین و فعالیت‌هایت را در یک نگاه مرور کن و عملکردت را بهتر بشناس" },
  { icon: <IconBarChart/>, title: "کالری شماری هوشمند", desc: "وعده های غذایی روزانه رو وارد کن و با دستیار هوش مصنوعی هوشمند کالری شماری کن" },
  { icon: <IconBell/>, title: "ثبت پیشرفت", desc: "وزن و روند تغییراتت را ثبت کن و همیشه تصویر روشنی از مسیر پیشرفتت داشته باش" },
];

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  const [hov, setHov] = useState(false);
  return (
    <div className="rtl glass-panel glass-static glass-hover-accent"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "24px 20px", borderRadius: 20, transform: hov ? "translateY(-3px)" : "translateY(0)", cursor: "default" }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: hov ? "rgba(250,234,92,0.22)" : "rgba(250,234,92,0.1)", border: "1px solid rgba(250,234,92,0.25)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 16, color: "#faea5c", transition: "all 0.3s", boxShadow: hov ? "0 4px 20px rgba(250,234,92,0.2)" : "none" }}>{icon}</div>
      <h3 style={{ color: "#F5F5F7", fontSize: 16, fontWeight: 700, marginBottom: 8, ...F }}>{title}</h3>
      <p style={{ color: "rgba(245,245,247,0.5)", fontSize: 14, lineHeight: 1.7, ...F }}>{desc}</p>
    </div>
  );
}

function Features() {
  const w = useW();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <section style={{ padding: isMobile ? "64px 20px" : "100px 24px", position: "relative" }}>
      <div className="ambient-blob" style={{ width: isMobile ? 280 : 500, height: isMobile ? 280 : 500, background: "radial-gradient(circle, rgba(59,145,73,0.1) 0%, transparent 70%)", top: 0, left: "50%", transform: "translateX(-50%)" }}/>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <SectionHeader badge="ویژگی‌های برجسته" title={<>هر چیزی که برای مدیریت مسیر <span className="gradient-text">تناسب اندام</span> نیاز داری</>} sub="گامپتو به جای ساخت برنامه، تمام ابزارهای لازم برای ثبت، مدیریت و پیگیری برنامه‌های شخصی تو را در اختیارت قرار می‌دهد."/>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 14 : 20 }}>
          {FEATURES.map((f, i) => <FeatureCard key={i} {...f}/>)}
        </div>
      </div>
    </section>
  );
}

// ─── App Screens ──────────────────────────────────────────────────────────────

function AppScreens() {
  const w = useW();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const phoneW = isMobile ? 140 : isTablet ? 160 : 200;

  return (
    <section style={{ padding: isMobile ? "48px 20px 64px" : "80px 24px 100px", position: "relative", overflow: "hidden" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader badge="پیش‌نمایش اپ" title={<>تجربه‌ای <span className="gradient-text">متفاوت</span> از تناسب اندام</>}/>

        <div style={{ display: "flex", gap: isMobile ? 16 : 28, justifyContent: "center", alignItems: "flex-end", flexWrap: "nowrap", overflowX: isMobile ? "auto" : "visible", paddingBottom: isMobile ? 12 : 0 }}>
          {!isMobile && (
            <div className="animate-float-2" style={{ opacity: 0.65, transform: `scale(0.88) rotate(-4deg)` }}>
              <PhoneMockup screen="home" width={phoneW}/>
            </div>
          )}
          <div className="animate-float">
            <PhoneMockup screen="workout" width={isMobile ? phoneW + 20 : phoneW}/>
          </div>
          {!isMobile && (
            <div className="animate-float-3" style={{ opacity: 0.65, transform: `scale(0.88) rotate(4deg)` }}>
              <PhoneMockup screen="progress" width={phoneW}/>
            </div>
          )}
        </div>

        {isMobile && (
          /* show all 3 as a scrollable row on very small screens */
          <div style={{ display: "flex", gap: 14, overflowX: "auto", paddingBottom: 8, marginTop: 20, justifyContent: "center" }}>
            {(["home", "progress"] as const).map(s => (
              <div key={s} style={{ flexShrink: 0 }}>
                <PhoneMockup screen={s} width={120}/>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const w = useW();
  const isMobile = w < 768;

  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "44px 20px 32px" : "64px 24px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="rtl" style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", marginBottom: isMobile ? 36 : 56 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
            <img src={gampetooLogo} alt="Gampetoo" style={{ width: 32, height: 32, objectFit: "contain", flexShrink: 0 }}/>
            <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F5F7", letterSpacing: "-0.02em" }}>Gampetoo</span>
          </div>
          <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 14, lineHeight: 1.7, marginBottom: 20, whiteSpace: isMobile ? "normal" : "nowrap", maxWidth: isMobile ? 280 : "none", ...F }}>بهترین اپلیکیشن تناسب اندام برای رسیدن به هدف‌های سلامتی شما</p>
          <div style={{ display: "flex", gap: 10 }}>
            {["tw", "ig", "yt"].map((s, i) => (
              <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(245,245,247,0.5)", fontSize: 11 }}>{s}</div>
            ))}
          </div>
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p style={{ color: "rgba(245,245,247,0.3)", fontSize: 13, ...F }}> Gampetoo. تمامی حقوق محفوظ است.</p>
          <div style={{ display: "flex", gap: 4, alignItems: "center", direction: "rtl" }}>
            <span style={{ color: "rgba(245,245,247,0.3)", fontSize: 13, ...F }}>ساخته شده با</span>
            <span style={{ color: "#faea5c" }}>♥</span>
            <span style={{ color: "rgba(245,245,247,0.3)", fontSize: 13, ...F }}>در ایران</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <div style={{ background: "#090909", minHeight: "100vh" }}>
      <Nav/>
      <Hero/>
      <Features/>
      <AppScreens/>
      <Footer/>
    </div>
  );
}
