import { useState, useEffect } from "react";
import appScreenshot from "@/imports/413CE792-E4B2-42C6-B034-B4071E914841.png";

// ─── Responsive hook ──────────────────────────────────────────────────────────

function useW() {
  const [w, setW] = useState(typeof window !== "undefined" ? window.innerWidth : 1200);
  useEffect(() => {
    const fn = () => setW(window.innerWidth);
    window.addEventListener("resize", fn);
    return () => window.removeEventListener("resize", fn);
  }, []);
  return w;
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
function IconChevron({ open }: { open: boolean }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
      style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.3s ease" }}>
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );
}
function IconApple() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
    </svg>
  );
}
function IconGoogle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );
}
function IconStar() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="#faea5c" stroke="#faea5c" strokeWidth="1">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#faea5c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  );
}
function IconFlame() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#132f18" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/>
    </svg>
  );
}
function IconMenu() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  );
}
function IconClose() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function Logo() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
      <div style={{
        width: 32, height: 32, borderRadius: 10,
        background: "#faea5c",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 4px 12px rgba(250,234,92,0.35)",
        flexShrink: 0,
      }}>
        <IconFlame/>
      </div>
      <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F5F7", letterSpacing: "-0.02em" }}>Gampetoo</span>
    </div>
  );
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_LINKS = ["ویژگی‌ها", "امکانات", "نظرات کاربران", "دانلود"];

function Nav() {
  const w = useW();
  const isMobile = w < 768;
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // close menu on resize to desktop
  useEffect(() => { if (!isMobile) setMenuOpen(false); }, [isMobile]);

  return (
    <>
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        transition: "background-color 0.4s, border-color 0.4s",
        backgroundColor: scrolled || menuOpen ? "rgb(0 0 0 / 30%)" : "transparent",
        borderBottom: scrolled ? "1px solid rgba(255,255,255,0.06)" : "1px solid transparent",
      }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", height: 60 }}>
            <Logo/>

            {/* Desktop links */}
            {!isMobile && (
              <div className="rtl" style={{ display: "flex", gap: 32, alignItems: "center" }}>
                {NAV_LINKS.map(item => (
                  <a key={item} href="#" style={{ color: "rgba(245,245,247,0.6)", fontSize: 14, fontWeight: 500, textDecoration: "none", transition: "color 0.2s", ...F }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#F5F5F7")}
                    onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,247,0.6)")}
                  >{item}</a>
                ))}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              {!isMobile && (
                <button className="rtl" style={{ background: "none", border: "none", color: "rgba(245,245,247,0.6)", fontSize: 14, fontWeight: 500, cursor: "pointer", padding: "8px 12px", ...F, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#F5F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,247,0.6)")}
                >ورود</button>
              )}
              <button className="btn-primary" style={{
                fontSize: isMobile ? 13 : 14, fontWeight: 700,
                padding: isMobile ? "9px 16px" : "10px 20px", borderRadius: 10, ...F,
                boxShadow: "0 4px 16px rgba(250,234,92,0.3)",
              }}
              >ورود</button>

              {isMobile && (
                <button onClick={() => setMenuOpen(o => !o)} style={{ background: "none", border: "none", color: "#F5F5F7", cursor: "pointer", padding: 6, display: "flex", alignItems: "center" }}>
                  {menuOpen ? <IconClose/> : <IconMenu/>}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile drawer */}
        {isMobile && (
          <div style={{
            maxHeight: menuOpen ? 400 : 0,
            overflow: "hidden",
            transition: "max-height 0.4s ease",
            borderTop: menuOpen ? "1px solid rgba(255,255,255,0.06)" : "none",
          }}>
            <div className="rtl" style={{ padding: "16px 20px 24px", display: "flex", flexDirection: "column", gap: 4 }}>
              {NAV_LINKS.map(item => (
                <a key={item} href="#" onClick={() => setMenuOpen(false)} style={{
                  color: "rgba(245,245,247,0.7)", fontSize: 16, fontWeight: 500,
                  padding: "12px 0", textDecoration: "none", borderBottom: "1px solid rgba(255,255,255,0.05)", ...F,
                }}>{item}</a>
              ))}
              <a href="#" style={{ color: "rgba(245,245,247,0.7)", fontSize: 16, fontWeight: 500, padding: "12px 0", textDecoration: "none", ...F }}>ورود به حساب</a>
            </div>
          </div>
        )}
      </nav>
    </>
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
      <div className="ambient-blob" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(250,234,92,0.08) 0%, transparent 70%)", bottom: 50, left: -100 }}/>

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
              از همین امروز شروع کن!
            </h1>

            <p style={{ fontSize: 15, lineHeight: 1.75, color: "rgba(245,245,247,0.55)", marginBottom: 28, ...F }}>
              برنامه تمرینی و تغذیه شخصی، کالری شماری هوشمند، گزارش پیشرفت و انگیزه روزانه؛ همه در یک اپلیکیشن.
            </p>

            {/* CTAs — full width stacked */}
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
              <button className="btn-primary" style={{ width: "100%", fontSize: 16, fontWeight: 700, padding: "15px 24px", borderRadius: 14, ...F, boxShadow: "0 8px 32px rgba(250,234,92,0.3)" }}>
                ورود به برنامه
              </button>
              <button className="btn-ghost" style={{ width: "100%", fontSize: 16, fontWeight: 600, padding: "15px 24px", borderRadius: 14, ...F }}>
                مشاهده امکانات
              </button>
            </div>

            {/* Social proof */}
            <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 40 }}>
              <div style={{ display: "flex" }}>
                {["#faea5c", "#9dc730", "#3b9149", "#296533", "#1d4724"].map((c, i) => (
                  <div key={i} style={{ width: 28, height: 28, borderRadius: "50%", background: `linear-gradient(135deg, ${c}, #090909)`, border: "2px solid #090909", marginRight: i < 4 ? -7 : 0 }}/>
                ))}
              </div>
              <div>
                <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[1,2,3,4,5].map(i => <IconStar key={i}/>)}</div>
                <p style={{ color: "rgba(245,245,247,0.5)", fontSize: 11, ...F }}>+۵۰,۰۰۰ کاربر فعال</p>
              </div>
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
          <div style={{ display: "grid", gridTemplateColumns: isTablet ? "1fr 1fr" : "1fr 1fr", gap: isTablet ? 40 : 80, alignItems: "center", minHeight: "90vh" }}>
            {/* Text */}
            <div className="rtl animate-fade-in-up" style={{ animationFillMode: "forwards", opacity: 0 }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "7px 14px", borderRadius: 100, background: "rgba(250,234,92,0.1)", border: "1px solid rgba(250,234,92,0.25)", marginBottom: 28 }}>
                <span className="animate-pulse-green" style={{ width: 6, height: 6, borderRadius: "50%", background: "#faea5c", display: "inline-block" }}/>
                <span style={{ color: "#faea5c", fontSize: 13, fontWeight: 600, ...F }}>نسخه ۲.۰ اکنون در دسترس است</span>
              </div>

              <h1 style={{ fontSize: isTablet ? "clamp(28px,4vw,40px)" : "clamp(32px, 4vw, 54px)", fontWeight: 800, lineHeight: 1.25, color: "#F5F5F7", letterSpacing: "-0.02em", marginBottom: 20, ...F }}>
                برنامه تمرینی و غذایی<br/>
                <span className="gradient-text">شخصی خودت</span> رو<br/>
                از همین امروز شروع کن!
              </h1>

              <p style={{ fontSize: isTablet ? 15 : 17, lineHeight: 1.7, color: "rgba(245,245,247,0.55)", marginBottom: 36, ...F }}>
                برنامه تمرینی و تغذیه شخصی، کالری شماری هوشمند، گزارش پیشرفت و انگیزه روزانه؛ همه در یک اپلیکیشن.
              </p>

              <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 36 }}>
                <button className="btn-primary" style={{ fontSize: 16, fontWeight: 700, padding: "14px 32px", borderRadius: 14, ...F, boxShadow: "0 8px 32px rgba(250,234,92,0.3)" }}
                >ورود به برنامه</button>
                <button className="btn-ghost" style={{ fontSize: 16, fontWeight: 600, padding: "14px 32px", borderRadius: 14, ...F }}
                >مشاهده امکانات</button>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
                <div style={{ display: "flex" }}>
                  {["#faea5c", "#9dc730", "#3b9149", "#296533", "#1d4724"].map((c, i) => (
                    <div key={i} style={{ width: 32, height: 32, borderRadius: "50%", background: `linear-gradient(135deg, ${c}, #090909)`, border: "2px solid #090909", marginRight: i < 4 ? -8 : 0 }}/>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 2 }}>{[1,2,3,4,5].map(i => <IconStar key={i}/>)}</div>
                  <p style={{ color: "rgba(245,245,247,0.5)", fontSize: 12, ...F }}>+۵۰,۰۰۰ کاربر فعال</p>
                </div>
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
            <span style={{ fontSize: 11, color: "rgba(245,245,247,0.6)", ...F }}>اسکرول کنید</span>
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
  { icon: <IconDumbbell/>, title: "تمرینات هوشمند", desc: "برنامه تمرینی کاملاً شخصی‌سازی شده بر اساس سطح آمادگی و هدف شما" },
  { icon: <IconFork/>, title: "برنامه غذایی شخصی", desc: "رژیم غذایی متناسب با نیاز بدن و هدف کاهش یا افزایش وزن شما" },
  { icon: <IconTrendUp/>, title: "پیگیری پیشرفت", desc: "مشاهده روند پیشرفت خود به صورت گرافیکی و تحلیل هفتگی" },
  { icon: <IconScale/>, title: "ثبت وزن", desc: "ثبت روزانه وزن و مشاهده منحنی تغییرات در طول زمان" },
  { icon: <IconBarChart/>, title: "گزارش‌های آماری", desc: "گزارش‌های جامع و دقیق از عملکرد تمرین و تغذیه شما" },
  { icon: <IconBell/>, title: "یادآوری تمرین", desc: "هشدارهای هوشمند برای تمرین، آب نوشیدن و وعده‌های غذایی" },
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
      <div className="ambient-blob" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(59,145,73,0.1) 0%, transparent 70%)", top: 0, left: "50%", transform: "translateX(-50%)" }}/>
      <div style={{ maxWidth: 1200, margin: "0 auto", position: "relative", zIndex: 1 }}>
        <SectionHeader badge="ویژگی‌های برجسته" title={<>همه چیزی که برای <span className="gradient-text">تناسب اندام</span> نیاز داری</>} sub="ابزارهای پیشرفته برای رسیدن به بهترین نسخه از خودت"/>
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

        <div style={{ display: "flex", gap: isMobile ? 8 : 12, justifyContent: "center", flexWrap: "wrap", marginTop: isMobile ? 32 : 48 }}>
          {["کالری‌شمار هوشمند", "برنامه تمرینی AI", "پیشرفت هفتگی", "چالش‌های روزانه", "جامعه کاربران"].map((tag, i) => (
            <div key={i} style={{ padding: isMobile ? "7px 14px" : "8px 18px", borderRadius: 100, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(245,245,247,0.6)", fontSize: isMobile ? 12 : 13, ...F }}>{tag}</div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Stats ────────────────────────────────────────────────────────────────────

const STATS = [
  { value: "+۵۰ هزار", label: "تمرین تکمیل‌شده" },
  { value: "+۱ میلیون", label: "کالری سوزانده‌شده" },
  { value: "۹۲٪", label: "تحقق هدف هفتگی" },
  { value: "+۵۰ هزار", label: "کاربر فعال" },
];

function Stats() {
  const w = useW();
  const isMobile = w < 640;
  const cols = isMobile ? 2 : 4;

  return (
    <section style={{ padding: isMobile ? "48px 20px" : "80px 24px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="glass-panel glass-static" style={{ borderRadius: isMobile ? 20 : 28, padding: isMobile ? "36px 20px" : "64px 48px", position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -60, left: "50%", transform: "translateX(-50%)", width: 400, height: 200, background: "radial-gradient(ellipse, rgba(250,234,92,0.12) 0%, transparent 70%)" }}/>
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? "28px 16px" : 40, position: "relative", zIndex: 1 }}>
            {STATS.map((s, i) => (
              <div key={i} className="rtl" style={{ textAlign: "center" }}>
                <div className="gradient-text" style={{ fontSize: isMobile ? "clamp(22px,5vw,30px)" : "clamp(28px,3vw,42px)", fontWeight: 800, letterSpacing: "-0.02em", ...F, marginBottom: 6 }}>{s.value}</div>
                <p style={{ color: "rgba(245,245,247,0.45)", fontSize: isMobile ? 12 : 14, ...F }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Testimonials ─────────────────────────────────────────────────────────────

const TESTIMONIALS = [
  { name: "علی محمدی", role: "ورزشکار آماتور", text: "Gampetoo زندگیم رو عوض کرد. در ۳ ماه ۱۲ کیلو وزن کم کردم و حالا انرژیم بیشتر از همیشه‌ست!", rating: 5, avatar: "ع" },
  { name: "سارا کریمی", role: "مادر شاغل", text: "برنامه غذایی شخصی واقعاً کار می‌کنه. دیگه لازم نیست ساعت‌ها فکر کنم چی بخورم.", rating: 5, avatar: "س" },
  { name: "محمد حسینی", role: "مربی بدنسازی", text: "این اپ رو به همه مشتریام معرفی می‌کنم. گزارش‌های آماریش بی‌نظیره.", rating: 5, avatar: "م" },
];

function TestimonialCard({ name, role, text, rating, avatar }: typeof TESTIMONIALS[0]) {
  const [hov, setHov] = useState(false);
  return (
    <div className="rtl glass-panel glass-static glass-hover-accent" onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ padding: "24px", borderRadius: 20, transform: hov ? "translateY(-3px)" : "translateY(0)" }}>
      <div style={{ display: "flex", gap: 3, marginBottom: 16 }}>{Array.from({ length: rating }).map((_, i) => <IconStar key={i}/>)}</div>
      <p style={{ color: "rgba(245,245,247,0.75)", fontSize: 15, lineHeight: 1.75, marginBottom: 20, ...F }}>"{text}"</p>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ width: 40, height: 40, borderRadius: "50%", background: "#327b3e", display: "flex", alignItems: "center", justifyContent: "center", color: "#faea5c", fontSize: 15, fontWeight: 700, ...F, flexShrink: 0 }}>{avatar}</div>
        <div>
          <p style={{ color: "#F5F5F7", fontSize: 14, fontWeight: 600, ...F }}>{name}</p>
          <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 12, ...F }}>{role}</p>
        </div>
      </div>
    </div>
  );
}

function Testimonials() {
  const w = useW();
  const isMobile = w < 640;
  const isTablet = w >= 640 && w < 1024;
  const cols = isMobile ? 1 : isTablet ? 2 : 3;

  return (
    <section style={{ padding: isMobile ? "64px 20px" : "80px 24px 100px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <SectionHeader badge="نظرات کاربران" title="کاربران ما چه می‌گویند"/>
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: isMobile ? 14 : 20 }}>
          {TESTIMONIALS.map((t, i) => <TestimonialCard key={i} {...t}/>)}
        </div>
      </div>
    </section>
  );
}

// ─── FAQ ──────────────────────────────────────────────────────────────────────

const FAQS = [
  { q: "آیا Gampetoo برای مبتدیان مناسب است؟", a: "بله، Gampetoo برای تمام سطوح آمادگی جسمانی طراحی شده است. از مبتدی تا حرفه‌ای، برنامه‌های مختلفی ارائه می‌دهیم." },
  { q: "آیا می‌توانم بدون تجهیزات ورزشی استفاده کنم؟", a: "کاملاً! ما برنامه‌های تمرینی خانگی بدون نیاز به وسایل خاص داریم که به همان اندازه موثر هستند." },
  { q: "هزینه اشتراک چقدر است؟", a: "Gampetoo یک نسخه رایگان با امکانات پایه و یک اشتراک پریمیوم با دسترسی کامل ارائه می‌دهد." },
  { q: "آیا داده‌هایم امن هستند؟", a: "بله، ما از آخرین استانداردهای رمزنگاری استفاده می‌کنیم و هرگز اطلاعات شخصی شما را به اشتراک نمی‌گذاریم." },
  { q: "آیا می‌توانم با مربی شخصی تعامل داشته باشم؟", a: "در نسخه پریمیوم، دسترسی به مربیان متخصص از طریق چت زنده وجود دارد." },
];

function FAQ() {
  const [open, setOpen] = useState<number | null>(null);
  const w = useW();
  const isMobile = w < 768;

  return (
    <section style={{ padding: isMobile ? "64px 20px" : "80px 24px 100px" }}>
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <SectionHeader badge="سوالات متداول" title="سوال داری؟"/>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {FAQS.map((faq, i) => (
            <div key={i} className="glass-panel glass-static" style={{ borderRadius: 16, overflow: "hidden", boxShadow: open === i
              ? "0 0 0 1px rgba(250,234,92,0.35), 1.25px 0px 1px -0.75px rgb(219 219 219 / 35%), -1.25px 0px 1px -0.75px rgb(219 219 219 / 35%), 0px 0px 0.5px 0.5px rgb(219 219 219 / 30%), 0 10px 30px -14px rgb(0 0 0 / 55%)"
              : undefined }}>
              <button onClick={() => setOpen(open === i ? null : i)} className="rtl"
                style={{ width: "100%", padding: isMobile ? "16px 18px" : "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", background: "none", border: "none", cursor: "pointer", color: "#F5F5F7", textAlign: "right" }}>
                <span style={{ fontSize: isMobile ? 14 : 15, fontWeight: 600, ...F, flex: 1, lineHeight: 1.5 }}>{faq.q}</span>
                <span style={{ color: "#faea5c", marginRight: 12, flexShrink: 0 }}><IconChevron open={open === i}/></span>
              </button>
              <div className={`faq-answer ${open === i ? "open" : ""}`}>
                <p className="rtl" style={{ padding: isMobile ? "0 18px 16px" : "0 24px 20px", color: "rgba(245,245,247,0.55)", fontSize: 14, lineHeight: 1.75, ...F }}>{faq.a}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ─── Download CTA ─────────────────────────────────────────────────────────────

function DownloadCTA() {
  const w = useW();
  const isMobile = w < 640;

  return (
    <section style={{ padding: isMobile ? "48px 20px 64px" : "80px 24px 100px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="glass-panel glass-static" style={{ borderRadius: isMobile ? 24 : 32, boxShadow: "0 0 0 1px rgba(250,234,92,0.2), 1.25px 0px 1px -0.75px rgb(219 219 219 / 35%), -1.25px 0px 1px -0.75px rgb(219 219 219 / 35%), 0px 0px 0.5px 0.5px rgb(219 219 219 / 30%), 0 10px 30px -14px rgb(0 0 0 / 55%)", padding: isMobile ? "44px 24px" : "80px 48px", textAlign: "center", position: "relative", overflow: "hidden" }}>
          <div className="ambient-blob" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(250,234,92,0.16) 0%, transparent 70%)", top: -100, left: "50%", transform: "translateX(-50%)" }}/>
          <div style={{ position: "relative", zIndex: 1 }}>
            <div style={{ display: "inline-flex", padding: "5px 14px", borderRadius: 100, background: "rgba(250,234,92,0.1)", border: "1px solid rgba(250,234,92,0.3)", marginBottom: 20 }}>
              <span style={{ color: "#faea5c", fontSize: 12, fontWeight: 600, ...F }}>همین الان دانلود کن</span>
            </div>
            <h2 className="rtl" style={{ fontSize: isMobile ? "clamp(24px,7vw,36px)" : "clamp(28px,4vw,52px)", fontWeight: 800, color: "#F5F5F7", letterSpacing: "-0.02em", marginBottom: 14, ...F }}>
              سفر تناسب اندامت<br/>را امروز شروع کن
            </h2>
            <p className="rtl" style={{ color: "rgba(245,245,247,0.5)", fontSize: isMobile ? 15 : 17, marginBottom: 36, ...F, lineHeight: 1.7 }}>
              بیش از ۵۰,۰۰۰ نفر با Gampetoo به هدفشان رسیدند
            </p>

            {/* Download buttons */}
            <div style={{ display: "flex", flexDirection: isMobile ? "column" : "row", gap: 14, justifyContent: "center", alignItems: "center", marginBottom: 32 }}>
              <button style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 14, background: "#F5F5F7", border: "none", cursor: "pointer", transition: "transform 0.2s, box-shadow 0.2s", boxShadow: "0 8px 24px rgba(0,0,0,0.3)", width: isMobile ? "100%" : "auto", justifyContent: "center" }}
                onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.4)"; }}
                onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 24px rgba(0,0,0,0.3)"; }}
              >
                <IconApple/>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "#555", ...F, margin: 0 }}>دانلود از</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#111", fontFamily: "'Inter', sans-serif", margin: 0 }}>App Store</p>
                </div>
              </button>
              <button className="glass-panel" style={{ display: "flex", alignItems: "center", gap: 12, padding: "14px 28px", borderRadius: 14, cursor: "pointer", width: isMobile ? "100%" : "auto", justifyContent: "center" }}
              >
                <IconGoogle/>
                <div style={{ textAlign: "right" }}>
                  <p style={{ fontSize: 10, color: "rgba(245,245,247,0.5)", ...F, margin: 0 }}>دانلود از</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#F5F5F7", fontFamily: "'Inter', sans-serif", margin: 0 }}>Google Play</p>
                </div>
              </button>
            </div>

            <div style={{ display: "flex", gap: isMobile ? 16 : 28, justifyContent: "center", flexWrap: "wrap" }}>
              {["رایگان برای شروع", "بدون کارت بانکی", "لغو هر زمان"].map((b, i) => (
                <div key={i} className="rtl" style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <IconCheck/>
                  <span style={{ color: "rgba(245,245,247,0.5)", fontSize: isMobile ? 12 : 13, ...F }}>{b}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  const w = useW();
  const isMobile = w < 768;

  const cols = [
    { title: "محصول", links: ["ویژگی‌ها", "امکانات", "قیمت‌گذاری", "دانلود"] },
    { title: "شرکت", links: ["درباره ما", "وبلاگ", "کارها", "تماس با ما"] },
    { title: "پشتیبانی", links: ["مرکز راهنما", "جامعه", "حریم خصوصی", "شرایط استفاده"] },
  ];

  return (
    <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: isMobile ? "44px 20px 32px" : "64px 24px 40px" }}>
      <div style={{ maxWidth: 1200, margin: "0 auto" }}>
        <div className="rtl" style={{ display: "grid", gridTemplateColumns: isMobile ? "1fr 1fr" : "2fr 1fr 1fr 1fr", gap: isMobile ? "32px 20px" : 48, marginBottom: isMobile ? 36 : 56 }}>
          {/* Brand — full width on mobile */}
          <div style={{ gridColumn: isMobile ? "1 / -1" : "auto" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "#faea5c", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(250,234,92,0.35)" }}>
                <IconFlame/>
              </div>
              <span style={{ fontWeight: 700, fontSize: 18, color: "#F5F5F7", letterSpacing: "-0.02em" }}>Gampetoo</span>
            </div>
            <p style={{ color: "rgba(245,245,247,0.4)", fontSize: 14, lineHeight: 1.7, marginBottom: 20, ...F, maxWidth: 280 }}>بهترین اپلیکیشن تناسب اندام برای رسیدن به هدف‌های سلامتی شما</p>
            <div style={{ display: "flex", gap: 10 }}>
              {["tw", "ig", "yt"].map((s, i) => (
                <div key={i} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "rgba(245,245,247,0.5)", fontSize: 11 }}>{s}</div>
              ))}
            </div>
          </div>

          {cols.map((col, ci) => (
            <div key={ci}>
              <h4 style={{ color: "#F5F5F7", fontSize: 13, fontWeight: 600, marginBottom: 16, ...F }}>{col.title}</h4>
              {col.links.map((link, li) => (
                <a key={li} href="#" style={{ display: "block", color: "rgba(245,245,247,0.45)", fontSize: 13, marginBottom: 10, textDecoration: "none", ...F, transition: "color 0.2s" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#F5F5F7")}
                  onMouseLeave={e => (e.currentTarget.style.color = "rgba(245,245,247,0.45)")}
                >{link}</a>
              ))}
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: 20, display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
          <p style={{ color: "rgba(245,245,247,0.3)", fontSize: 13, ...F }}>© ۱۴۰۴ Gampetoo. تمامی حقوق محفوظ است.</p>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
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
      <Stats/>
      <Testimonials/>
      <FAQ/>
      <DownloadCTA/>
      <Footer/>
    </div>
  );
}
