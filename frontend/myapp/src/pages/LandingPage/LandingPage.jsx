import { Link } from "react-router-dom";
import { useEffect, useRef } from "react";
import { BookOpen } from "lucide-react";

export default function LandingPage() {
  const currentYear = new Date().getFullYear();
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const particles = Array.from({ length: 70 }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      size: Math.random() * 1.2 + 0.2,
      speedX: (Math.random() - 0.5) * 0.15,
      speedY: (Math.random() - 0.5) * 0.15,
      alpha: Math.random() * 0.25 + 0.05,
      pulse: Math.random() * Math.PI * 2,
    }));

    let raf;
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.speedX;
        p.y += p.speedY;
        p.pulse += 0.01;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 130) {
            const a = (1 - dist / 130) * 0.06;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(32,178,120,${a})`;
            ctx.lineWidth = 0.5;
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      particles.forEach((p) => {
        const pa = p.alpha * (0.7 + 0.3 * Math.sin(p.pulse));
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(32,178,120,${pa})`;
        ctx.fill();
      });

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, []);

  const stats = [
    { value: "500+", label: "Original Tales" },
    { value: "12K+", label: "Active Readers" },
    { value: "200+", label: "Tamil Authors" },
  ];

  const features = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <rect x="4" y="4" width="20" height="20" rx="3" stroke="rgba(32,178,120,0.6)" strokeWidth="1.2" />
          <line x1="8" y1="9" x2="20" y2="9" stroke="rgba(32,178,120,0.5)" strokeWidth="1.2" />
          <line x1="8" y1="13" x2="20" y2="13" stroke="rgba(32,178,120,0.35)" strokeWidth="1.2" />
          <line x1="8" y1="17" x2="16" y2="17" stroke="rgba(32,178,120,0.25)" strokeWidth="1.2" />
        </svg>
      ),
      title: "Curated Library",
      desc: "Handpicked novels across romance, thriller, mythology and more genres.",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <path d="M6 22 L6 8 Q6 6 8 6 L20 6 Q22 6 22 8 L22 20" stroke="rgba(32,178,120,0.6)" strokeWidth="1.2" fill="none" />
          <path d="M9 12 L15 12 M9 15 L13 15" stroke="rgba(32,178,120,0.4)" strokeWidth="1.2" />
          <circle cx="19" cy="20" r="4" stroke="rgba(32,178,120,0.6)" strokeWidth="1.2" fill="none" />
          <path d="M17.5 20 L18.5 21 L20.5 19" stroke="rgba(32,178,120,0.6)" strokeWidth="1.2" />
        </svg>
      ),
      title: "Write & Publish",
      desc: "Share your stories with a passionate reading community instantly.",
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
          <circle cx="14" cy="14" r="9" stroke="rgba(32,178,120,0.5)" strokeWidth="1.2" />
          <path d="M14 8 L14 14 L18 16" stroke="rgba(32,178,120,0.65)" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="14" cy="14" r="1.5" fill="rgba(32,178,120,0.7)" />
        </svg>
      ),
      title: "Track Progress",
      desc: "Reading list, favorites, and finished books all in one clean view.",
    },
  ];

  const testimonials = [
    { text: "The best Tamil literature platform I've found online.", name: "Priya S.", role: "Avid Reader" },
    { text: "Publishing my first novel here was seamless and beautiful.", name: "Karthik M.", role: "Author" },
    { text: "Discovered classics I never knew existed. Truly a gem.", name: "Meena R.", role: "Book Club Lead" },
  ];

  return (
    <div
      className="relative min-h-screen flex flex-col overflow-hidden text-[#1a2a3a]"
      style={{
        background:
          "linear-gradient(160deg, #e8f0f7 0%, #dde8f2 40%, #e4eef5 70%, #eaf2f8 100%)",
        fontFamily: "'Georgia', serif",
      }}
    >
      {/* Canvas particles */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 z-0 pointer-events-none"
      />

      {/* Soft blobs */}
      <div
        className="absolute top-[-10%] left-[-5%] w-[55%] h-[55%] rounded-full z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(180,210,240,0.45) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute bottom-[-10%] right-[-5%] w-[50%] h-[50%] rounded-full z-[1] pointer-events-none"
        style={{
          background:
            "radial-gradient(circle, rgba(160,200,235,0.35) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-[35%] left-[50%] w-[35%] h-[35%] rounded-full z-[1] pointer-events-none -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(circle, rgba(32,178,120,0.04) 0%, transparent 70%)",
        }}
      />

      {/* Top border */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(32,178,120,0.4) 20%, rgba(32,178,120,0.8) 50%, rgba(32,178,120,0.4) 80%, transparent)",
        }}
      />

      {/* NAV */}
      <nav className="relative z-10 flex items-center justify-between px-15 py-[22px] px-[60px]">
        <div className="flex items-center gap-2">
          <BookOpen size={28} color="#20b278" strokeWidth={2.2} />
          <span className="text-[22px] font-extrabold leading-none tracking-tight">
            <span className="text-[#111820]">SS </span>
            <span className="text-[#20b278]">LIBRARY</span>
          </span>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/login"
            className="px-[22px] py-[9px] rounded-lg text-[10px] font-sans font-bold tracking-[0.18em] uppercase text-[#20b278] no-underline backdrop-blur-sm"
            style={{
              border: "1px solid rgba(32,178,120,0.25)",
              background: "rgba(255,255,255,0.5)",
            }}
          >
            Login
          </Link>
          <Link
            to="/register"
            className="px-[22px] py-[9px] rounded-lg text-[10px] font-sans font-extrabold tracking-[0.18em] uppercase text-white no-underline"
            style={{
              background: "linear-gradient(135deg, #22c486 0%, #18a06e 100%)",
              border: "1px solid rgba(32,178,120,0.4)",
              boxShadow:
                "0 4px 18px rgba(32,178,120,0.28), inset 0 1px 0 rgba(255,255,255,0.25)",
            }}
          >
            Join Free
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center px-6 pt-8 pb-12 text-center">
        {/* Hero card */}
        <div
          className="w-full max-w-[820px] rounded-[28px] px-12 pt-[60px] pb-[52px] mb-8 backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.45)",
            border: "1px solid rgba(255,255,255,0.7)",
            boxShadow:
              "0 8px 48px rgba(160,200,240,0.22), 0 2px 12px rgba(32,178,120,0.08)",
          }}
        >
          {/* Badge */}
          <div className="flex justify-center mb-7">
            <div
              className="inline-flex items-center gap-2 px-5 py-[7px] rounded-full"
              style={{
                border: "1.5px solid rgba(32,178,120,0.35)",
                background: "rgba(32,178,120,0.06)",
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#20b278"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
              </svg>
              <span className="text-[10px] tracking-[0.22em] uppercase font-sans text-[#20b278] font-bold">
                Pure Literature
              </span>
            </div>
          </div>

          {/* Headlines */}
          <h1 className="text-[clamp(22px,7vw,68px)] font-extrabold leading-[1.08] tracking-[-0.02em] text-[#111820] m-0 mb-1.5">
            The Soul of
          </h1>
          <div className="text-center mb-6">
            <h1
              className="text-[clamp(22px,7vw,68px)] font-extrabold leading-[1.08] tracking-[-0.02em] m-0 inline-block"
              style={{
                background:
                  "linear-gradient(135deg, #22c486 0%, #18a06e 50%, #20b278 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Tamil Literature
            </h1>
          </div>

          {/* Subtext */}
          <p className="max-w-[480px] text-[17px] leading-[1.8] text-[#6a7f95] mx-auto mb-9 font-sans font-normal">
            A digital sanctuary where passionate writers and avid readers
            explore the rich tapestry of modern and classic Tamil novels.
          </p>

          {/* CTAs */}
          <div className="flex gap-3.5 flex-wrap justify-center">
            <Link
              to="/register"
              className="px-[38px] py-3.5 rounded-[10px] text-[11px] font-sans font-extrabold tracking-[0.18em] uppercase text-white no-underline"
              style={{
                background: "linear-gradient(135deg, #22c486 0%, #18a06e 100%)",
                boxShadow:
                  "0 6px 24px rgba(32,178,120,0.3), inset 0 1px 0 rgba(255,255,255,0.2)",
              }}
            >
              Start Reading — Free
            </Link>
            <Link
              to="/home"
              className="px-[38px] py-3.5 rounded-[10px] text-[11px] font-sans font-bold tracking-[0.18em] uppercase text-[#4a7a65] no-underline backdrop-blur-md"
              style={{
                background: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(32,178,120,0.22)",
              }}
            >
              Browse Stories →
            </Link>
          </div>
        </div>

        {/* Stats */}
        <div
          className="inline-flex mb-10 rounded-2xl overflow-hidden backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.55)",
            border: "1px solid rgba(255,255,255,0.75)",
            boxShadow: "0 4px 20px rgba(160,200,240,0.15)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              className="px-[42px] py-[18px] text-center"
              style={{
                borderRight:
                  i < stats.length - 1
                    ? "1px solid rgba(32,178,120,0.1)"
                    : "none",
              }}
            >
              <div className="text-[26px] font-extrabold text-[#20b278] tracking-[-0.02em] leading-none font-sans">
                {s.value}
              </div>
              <div className="mt-[5px] text-[9px] tracking-[0.2em] uppercase text-[#8aa0b8] font-sans font-bold">
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Feature cards */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 w-full max-w-[820px] mb-8">
          {features.map((f, i) => (
            <div
              key={i}
              className="rounded-2xl px-6 py-7 text-left backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.75)",
                boxShadow: "0 4px 20px rgba(160,200,240,0.12)",
              }}
            >
              <div className="mb-3.5">{f.icon}</div>
              <h3 className="text-[10px] font-sans font-extrabold tracking-[0.14em] uppercase text-[#20b278] m-0 mb-2">
                {f.title}
              </h3>
              <p className="text-[13px] font-sans leading-[1.7] text-[#6a7f95] m-0">
                {f.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Testimonials */}
        <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 w-full max-w-[820px] mb-10">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl px-5 py-[22px] text-left backdrop-blur-xl"
              style={{
                background: "rgba(255,255,255,0.55)",
                border: "1px solid rgba(255,255,255,0.75)",
                boxShadow: "0 4px 20px rgba(160,200,240,0.12)",
              }}
            >
              <div className="mb-2.5">
                {[0, 1, 2, 3, 4].map((s) => (
                  <span key={s} className="text-[#20b278] text-[11px] mr-0.5">
                    ★
                  </span>
                ))}
              </div>
              <p className="text-[13px] font-sans leading-[1.7] text-[#4a6070] m-0 mb-3.5 italic">
                "{t.text}"
              </p>
              <div>
                <div className="text-[11px] font-sans font-bold text-[#20b278] tracking-[0.04em]">
                  {t.name}
                </div>
                <div className="text-[9px] font-sans text-[#8aa0b8] tracking-[0.15em] uppercase mt-0.5">
                  {t.role}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Literary quote */}
        <div
          className="max-w-[560px] w-full px-[30px] py-6 text-left rounded-r-2xl rounded-l-none backdrop-blur-xl"
          style={{
            background: "rgba(255,255,255,0.5)",
            border: "1px solid rgba(255,255,255,0.7)",
            borderLeft: "3px solid rgba(32,178,120,0.5)",
            boxShadow: "0 4px 20px rgba(160,200,240,0.12)",
          }}
        >
          <p className="text-[15px] text-[#5a8070] italic leading-[1.75] m-0 mb-2.5">
            "A reader lives a thousand lives before he dies. The man who never
            reads lives only one."
          </p>
          <p className="text-[9px] text-[#8aa0b8] font-sans font-bold tracking-[0.2em] uppercase m-0">
            — George R.R. Martin
          </p>
        </div>
      </main>

      {/* FOOTER */}
      <footer
        className="relative z-10 px-[60px] py-[22px] flex items-center justify-between flex-wrap gap-3 backdrop-blur-md"
        style={{
          borderTop: "1px solid rgba(32,178,120,0.1)",
          background: "rgba(255,255,255,0.3)",
        }}
      >
        <p className="text-[9px] font-sans font-bold tracking-[0.18em] uppercase text-[#8aa0b8] m-0">
          © {currentYear} SM Tamil Novels
        </p>
        <div className="flex gap-7 flex-wrap justify-center">
          {["Curated Narratives", "Verified Authors", "Reader Community"].map(
            (item) => (
              <span
                key={item}
                className="text-[9px] font-sans font-bold tracking-[0.18em] uppercase text-[#8aa0b8]"
              >
                {item}
              </span>
            ),
          )}
        </div>
      </footer>

      {/* Bottom border */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(32,178,120,0.4) 20%, rgba(32,178,120,0.8) 50%, rgba(32,178,120,0.4) 80%, transparent)",
        }}
      />
    </div>
  );
}