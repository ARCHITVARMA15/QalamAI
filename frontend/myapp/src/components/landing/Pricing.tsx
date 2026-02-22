"use client";
import { useState } from "react";

const plans = [
    {
        name: "Quill",
        tagline: "For curious beginners",
        price: { monthly: 0, annual: 0 },
        badge: null,
        description: "Everything you need to start your first story.",
        color: "#9e9589",
        features: [
            "3 active projects",
            "5,000 AI words / month",
            "Basic knowledge graph",
            "Write, Rewrite, Describe",
            "Community support",
        ],
        cta: "Start for free",
        href: "/projects",
        ghost: true,
    },
    {
        name: "Folio",
        tagline: "For serious storytellers",
        price: { monthly: 12, annual: 9 },
        badge: "Most popular",
        description: "Unlimited creativity with the full KalamAI toolkit.",
        color: "#1a7a5e",
        features: [
            "Unlimited projects",
            "50,000 AI words / month",
            "Full knowledge graph + personas",
            "All AI actions + Tone tools",
            "Commit history dashboard",
            "Priority support",
        ],
        cta: "Start Folio",
        href: "/projects",
        ghost: false,
    },
    {
        name: "Manuscript",
        tagline: "For professional authors",
        price: { monthly: 29, annual: 22 },
        badge: null,
        description: "Pro-grade power for writers who publish.",
        color: "#c98c50",
        features: [
            "Everything in Folio",
            "Unlimited AI words",
            "Advanced story analytics",
            "Custom tone profiles",
            "Export to EPUB & PDF",
            "Dedicated account manager",
        ],
        cta: "Go Manuscript",
        href: "/projects",
        ghost: true,
    },
];

function Pricing() {
    const [annual, setAnnual] = useState(true);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@300;400;500;600&display=swap');

        .pricing-card {
          background: #fff;
          border: 1.5px solid #e8e2d9;
          border-radius: 20px;
          padding: 2rem 1.75rem 1.75rem;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
          transition: transform 0.25s ease, box-shadow 0.25s ease;
        }
        .pricing-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 16px 48px rgba(0,0,0,0.08);
        }
        .pricing-card.featured {
          border-color: #1a7a5e;
          background: linear-gradient(160deg, #f2faf7 0%, #fff 60%);
          box-shadow: 0 8px 32px rgba(26,122,94,0.12);
        }
        .pricing-card.featured:hover {
          box-shadow: 0 20px 56px rgba(26,122,94,0.18);
        }

        .plan-feature {
          display: flex;
          align-items: flex-start;
          gap: 0.6rem;
          font-size: 0.83rem;
          color: #5a5550;
          line-height: 1.5;
          padding: 0.35rem 0;
        }

        .pricing-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.4rem;
          width: 100%;
          padding: 0.75rem 1rem;
          border-radius: 11px;
          font-family: 'DM Sans', sans-serif;
          font-size: 0.88rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;
          text-decoration: none;
          letter-spacing: 0.01em;
          margin-top: auto;
        }
        .pricing-btn.solid {
          background: #1a7a5e;
          color: #fff;
          border: none;
          box-shadow: 0 4px 16px rgba(26,122,94,0.28);
        }
        .pricing-btn.solid:hover {
          background: #156650;
          box-shadow: 0 6px 20px rgba(26,122,94,0.38);
          transform: translateY(-1px);
        }
        .pricing-btn.outline {
          background: transparent;
          color: #4a4540;
          border: 1.5px solid #d8d2c8;
        }
        .pricing-btn.outline:hover {
          border-color: #1a7a5e;
          color: #1a7a5e;
          background: rgba(26,122,94,0.04);
        }

        .toggle-track {
          width: 44px; height: 24px;
          border-radius: 12px;
          border: none; cursor: pointer;
          position: relative;
          transition: background 0.2s;
          flex-shrink: 0;
        }
        .toggle-thumb {
          position: absolute;
          top: 3px;
          width: 18px; height: 18px;
          border-radius: 50%;
          background: #fff;
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
          transition: left 0.2s cubic-bezier(0.4,0,0.2,1);
        }

        @keyframes pricingFadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

            <section
                id="pricing"
                style={{
                    background: "#fdf5ee",
                    padding: "6rem 2rem",
                    position: "relative",
                    overflow: "hidden",
                }}
            >
                {/* Ambient blobs */}
                <div style={{ position: "absolute", top: "-80px", left: "-100px", width: "400px", height: "400px", borderRadius: "50%", background: "radial-gradient(circle, rgba(26,122,94,0.06) 0%, transparent 70%)", pointerEvents: "none" }} />
                <div style={{ position: "absolute", bottom: "-60px", right: "-80px", width: "350px", height: "350px", borderRadius: "50%", background: "radial-gradient(circle, rgba(201,140,80,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

                <div style={{ maxWidth: "1100px", margin: "0 auto", position: "relative", zIndex: 1 }}>

                    {/* ── Header ── */}
                    <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
                        {/* Section tag */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", background: "rgba(26,122,94,0.08)", border: "1px solid rgba(26,122,94,0.15)", borderRadius: "20px", padding: "0.3rem 0.9rem", marginBottom: "1.25rem" }}>
                            <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#1a7a5e" }} />
                            <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "#1a7a5e" }}>Pricing</span>
                        </div>

                        <h2 style={{ fontFamily: "'DM Serif Display', serif", fontSize: "clamp(2rem, 4vw, 3rem)", color: "#1a120a", letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "0.75rem" }}>
                            Simple, honest pricing
                        </h2>
                        <p style={{ fontSize: "1rem", color: "#6b5a4e", maxWidth: "440px", margin: "0 auto 2rem", lineHeight: 1.65 }}>
                            Every plan comes with a 14-day free trial. No credit card required.
                        </p>

                        {/* ── Toggle ── */}
                        <div style={{ display: "inline-flex", alignItems: "center", gap: "0.75rem", background: "#fff", border: "1px solid #e8e2d9", borderRadius: "12px", padding: "0.5rem 1rem" }}>
                            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: annual ? "#9e9589" : "#1a120a", transition: "color 0.2s", fontFamily: "'DM Sans',sans-serif" }}>Monthly</span>
                            <button
                                onClick={() => setAnnual(!annual)}
                                className="toggle-track"
                                style={{ background: annual ? "#1a7a5e" : "#d4cdc5" }}
                            >
                                <div className="toggle-thumb" style={{ left: annual ? "23px" : "3px" }} />
                            </button>
                            <span style={{ fontSize: "0.82rem", fontWeight: 500, color: annual ? "#1a120a" : "#9e9589", transition: "color 0.2s", fontFamily: "'DM Sans',sans-serif" }}>
                                Annual
                                <span style={{ marginLeft: "0.4rem", fontSize: "0.7rem", background: "rgba(26,122,94,0.1)", color: "#1a7a5e", padding: "0.1rem 0.4rem", borderRadius: "4px", fontWeight: 700 }}>
                                    Save 25%
                                </span>
                            </span>
                        </div>
                    </div>

                    {/* ── Cards ── */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem", alignItems: "start" }}>
                        {plans.map((plan, i) => (
                            <div
                                key={plan.name}
                                className={`pricing-card${plan.badge ? " featured" : ""}`}
                                style={{ animationDelay: `${i * 0.08}s` }}
                            >
                                {/* Featured badge */}
                                {plan.badge && (
                                    <div style={{ position: "absolute", top: "1.25rem", right: "1.25rem", background: "#1a7a5e", color: "#fff", fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", padding: "0.25rem 0.65rem", borderRadius: "20px" }}>
                                        {plan.badge}
                                    </div>
                                )}

                                {/* Color accent top bar */}
                                <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "3px", background: plan.color, borderRadius: "20px 20px 0 0" }} />

                                {/* Plan name */}
                                <div style={{ marginBottom: "1.25rem" }}>
                                    <p style={{ fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: plan.color, marginBottom: "0.3rem", fontFamily: "'DM Sans',sans-serif" }}>
                                        {plan.name}
                                    </p>
                                    <p style={{ fontSize: "0.83rem", color: "#9e9589", fontFamily: "'DM Sans',sans-serif" }}>{plan.tagline}</p>
                                </div>

                                {/* Price */}
                                <div style={{ marginBottom: "1.5rem", paddingBottom: "1.5rem", borderBottom: "1px solid #f0ebe3" }}>
                                    <div style={{ display: "flex", alignItems: "baseline", gap: "0.2rem" }}>
                                        <span style={{ fontFamily: "'DM Serif Display',serif", fontSize: "3rem", color: "#1a120a", lineHeight: 1, letterSpacing: "-0.04em" }}>
                                            {plan.price[annual ? "annual" : "monthly"] === 0 ? "Free" : `$${plan.price[annual ? "annual" : "monthly"]}`}
                                        </span>
                                        {plan.price[annual ? "annual" : "monthly"] > 0 && (
                                            <span style={{ fontSize: "0.82rem", color: "#9e9589", fontFamily: "'DM Sans',sans-serif" }}>/mo</span>
                                        )}
                                    </div>
                                    {annual && plan.price.monthly > 0 && (
                                        <p style={{ fontSize: "0.72rem", color: "#9e9589", marginTop: "0.25rem", fontFamily: "'DM Sans',sans-serif" }}>
                                            Billed annually · <span style={{ textDecoration: "line-through" }}>${plan.price.monthly}/mo</span>
                                        </p>
                                    )}
                                    <p style={{ fontSize: "0.8rem", color: "#6b5a4e", marginTop: "0.5rem", lineHeight: 1.5, fontFamily: "'DM Sans',sans-serif" }}>{plan.description}</p>
                                </div>

                                {/* Features */}
                                <div style={{ display: "flex", flexDirection: "column", marginBottom: "1.75rem", flex: 1 }}>
                                    {plan.features.map((f) => (
                                        <div key={f} className="plan-feature">
                                            <div style={{ width: "16px", height: "16px", borderRadius: "50%", background: `${plan.color}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "1px" }}>
                                                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke={plan.color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                                    <polyline points="20,6 9,17 4,12" />
                                                </svg>
                                            </div>
                                            <span style={{ fontFamily: "'DM Sans',sans-serif" }}>{f}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* CTA */}
                                <a href={plan.href} className={`pricing-btn ${plan.badge ? "solid" : "outline"}`}>
                                    {plan.cta}
                                    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M5 12h14M12 5l7 7-7 7" />
                                    </svg>
                                </a>
                            </div>
                        ))}
                    </div>

                    {/* ── Bottom note ── */}
                    <p style={{ textAlign: "center", marginTop: "2.5rem", fontSize: "0.8rem", color: "#9e9589", fontFamily: "'DM Sans',sans-serif" }}>
                        All plans include a 14-day trial · Cancel anytime · No hidden fees
                    </p>
                </div>
            </section>
        </>
    );
}

export default Pricing;