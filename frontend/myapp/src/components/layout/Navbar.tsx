// "use client"
// import Link from "next/link";
// import Button from "@/components/ui/Button";

// function Navbar() {
//   return (
//     // <header className="sticky top-0 z-50 bg-white/80 backdrop-blur">
//     <header className="sticky top-0 z-50 bg-[#f6f4ef]/80 backdrop-blur">

//       <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
//         {/* <img src="/images/Logo.png" alt="KalamAI" style={{ height: "36px", objectFit: "contain" }} /> */}

//         <Link href="/">
//           <img
//             src="/images/Logo.png"
//             alt="KalamAI"
//             style={{ height: "100px", width: "auto", objectFit: "contain" }}
//           />
//         </Link>

//         <ul className="hidden gap-8 text-sm text-gray-600 md:flex">
//           <li><Link href="/projects" className="cursor-pointer hover:text-black transition-colors">Projects</Link></li>
//           <li><Link href="/dashboard" className="cursor-pointer hover:text-black transition-colors">Dashboard</Link></li>
//         </ul>


//         {/* <ul className="hidden md:flex gap-10 text-base font-medium text-gray-700">
//           <li>
//             <Link
//               href="/projects"
//               className="cursor-pointer transition-colors hover:text-gray-900"
//             >
//               Projects
//             </Link>
//           </li>

//           <li>
//             <Link
//               href="/dashboard"
//               className="cursor-pointer transition-colors hover:text-gray-900"
//             >
//               Dashboard
//             </Link>
//           </li>
//         </ul> */}

//         <Link href="/projects">
//           <Button>Start writing free</Button>
//         </Link>
//       </nav>
//     </header>
//   );
// }

// export default Navbar;



"use client";
import { useState, useEffect } from "react";
import Link from "next/link";

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToPricing = () => {
    document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .nav-link {
          position: relative;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 500;
          color: #4a4540;
          text-decoration: none;
          padding: 0.3rem 0;
          transition: color 0.2s;
          letter-spacing: 0.01em;
        }
        .nav-link::after {
          content: '';
          position: absolute;
          bottom: -2px; left: 0; right: 0;
          height: 1.5px;
          background: #1a7a5e;
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.25s cubic-bezier(0.4, 0, 0.2, 1);
          border-radius: 2px;
        }
        .nav-link:hover { color: #1a120a; }
        .nav-link:hover::after { transform: scaleX(1); }

        .nav-btn-ghost {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.85rem;
          font-weight: 500;
          color: #4a4540;
          background: transparent;
          border: 1.5px solid #d8d2c8;
          border-radius: 10px;
          padding: 0.5rem 1.1rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
          text-decoration: none;
          display: inline-flex; align-items: center;
        }
        .nav-btn-ghost:hover {
          border-color: #1a7a5e;
          color: #1a7a5e;
          background: rgba(26,122,94,0.04);
        }

        .nav-btn-primary {
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          color: #fff;
          background: #1a7a5e;
          border: none;
          border-radius: 10px;
          padding: 0.55rem 1.35rem;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
          text-decoration: none;
          display: inline-flex; align-items: center; gap: 0.4rem;
          box-shadow: 0 2px 8px rgba(26,122,94,0.25);
        }
        .nav-btn-primary:hover {
          background: #156650;
          box-shadow: 0 4px 16px rgba(26,122,94,0.35);
          transform: translateY(-1px);
        }
        .nav-btn-primary:active { transform: translateY(0); }

        .nav-divider {
          width: 1px; height: 18px;
          background: #e0dbd2;
          flex-shrink: 0;
        }

        @keyframes navFadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <header style={{
        position: "sticky", top: 0, zIndex: 100,
        background: scrolled ? "rgba(253,245,238,0.97)" : "rgba(253,245,238,0.85)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: scrolled ? "1px solid rgba(201,140,80,0.18)" : "1px solid transparent",
        transition: "all 0.3s ease",
        boxShadow: scrolled ? "0 2px 20px rgba(0,0,0,0.06)" : "none",
        animation: "navFadeIn 0.5s ease both",
      }}>
        <nav style={{
          maxWidth: "1200px", margin: "0 auto",
          display: "flex", alignItems: "center",
          padding: "0 2rem", height: "68px",
          gap: "1rem",
        }}>

          {/* ── Logo ── */}
          <Link href="/" style={{ display: "flex", alignItems: "center", flexShrink: 0, marginRight: "0.5rem" }}>
            <img
              src="/images/Logo.png"
              alt="KalamAI"
              style={{ height: "72px", width: "auto", objectFit: "contain" }}
            />
          </Link>

          {/* ── Center nav links ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", flex: 1, justifyContent: "center" }}>
            {/* Subtle pill background on active group */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.15rem", background: "rgba(255,255,255,0.6)", border: "1px solid rgba(0,0,0,0.06)", borderRadius: "12px", padding: "0.3rem 0.5rem" }}>
              <Link href="/projects" className="nav-link" style={{ padding: "0.3rem 0.75rem" }}>
                Projects
              </Link>
              <div className="nav-divider" />
              <Link href="/dashboard" className="nav-link" style={{ padding: "0.3rem 0.75rem" }}>
                Dashboard
              </Link>
              <div className="nav-divider" />
              <button onClick={scrollToPricing} className="nav-link" style={{ background: "none", border: "none", cursor: "pointer", padding: "0.3rem 0.75rem", fontFamily: "'DM Sans', sans-serif", fontSize: "0.88rem", fontWeight: 500, color: "#4a4540", letterSpacing: "0.01em" }}>
                Pricing
              </button>
            </div>
          </div>

          {/* ── Right: ghost + primary CTA ── */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexShrink: 0 }}>
            <button onClick={scrollToPricing} className="nav-btn-ghost">
              See pricing
            </button>
            <Link href="/projects" className="nav-btn-primary">
              Start writing free
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </nav>
      </header>
    </>
  );
}

export default Navbar;