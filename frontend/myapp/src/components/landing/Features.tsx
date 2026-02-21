// "use client";

// import { motion } from "framer-motion";
// import {
//   Brain,
//   Layers,
//   Sliders,
//   Eye,
//   Zap,
//   Shield,
// } from "lucide-react";
// import { staggerContainer } from "@/lib/animations";
// import Card from "@/components/ui/Card";

// const features = [
//   {
//     icon: Brain,
//     title: "Narrative Consistency",
//     desc: "Detect character, timeline, and context mismatches across long content.",
//   },
//   {
//     icon: Layers,
//     title: "Structure & Flow",
//     desc: "Reorder sections and improve transitions intelligently.",
//   },
//   {
//     icon: Sliders,
//     title: "Controlled Style",
//     desc: "Shift tone without losing your authentic voice.",
//   },
//   {
//     icon: Eye,
//     title: "Explainable Changes",
//     desc: "Every edit comes with a clear rationale.",
//   },
//   {
//     icon: Zap,
//     title: "Fast & Focused",
//     desc: "Real-time suggestions without breaking flow.",
//   },
//   {
//     icon: Shield,
//     title: "Custom Core Logic",
//     desc: "No black-box prompt engineering. Full transparency.",
//   },
// ];

//  function Features() {
//   return (
//     <section className="bg-gray-50 py-24">
//       <div className="mx-auto max-w-7xl px-6">
//         <h2 className="text-center text-3xl font-serif font-semibold">
//           Built for writers who care about craft
//         </h2>

//         <motion.div
//           variants={staggerContainer}
//           initial="hidden"
//           whileInView="visible"
//           viewport={{ once: true }}
//           className="mt-16 grid gap-8 md:grid-cols-3"
//         >
//           {features.map((f, i) => (
//             <Card key={i}>
//               <f.icon className="h-6 w-6 text-emerald-700" />
//               <h3 className="mt-4 font-medium">{f.title}</h3>
//               <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
//             </Card>
//           ))}
//         </motion.div>
//       </div>
//     </section>
//   );
// }
// export default Features;



"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";

const FEATURES = [
  {
    number: "01",
    title: "Narrative Consistency Engine",
    headline: "Your story remembers everything. Even when you don't.",
    body: "KalamAI tracks every character name, timeline event, and plot thread across your entire manuscript. It flags when your protagonist's eye colour changes in chapter 12, when a dead character reappears, or when two scenes contradict each other — before your readers notice.",
    tag: "Consistency",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 6v6l4 2"/><path d="M22 2 12 12"/><circle cx="22" cy="2" r="2"/>
      </svg>
    ),
  },
  {
    number: "02",
    title: "AI-Powered Rewriting",
    headline: "Same story. Better words. Always your voice.",
    body: "Select any passage and KalamAI rewrites it — tightening structure, improving flow, elevating clarity — while preserving the tone and style that makes your writing uniquely yours. Not a replacement. A collaborator.",
    tag: "Enhancement",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z"/>
      </svg>
    ),
  },
  {
    number: "03",
    title: "Explainable Intelligence",
    headline: "Every suggestion comes with a reason.",
    body: "Unlike black-box AI tools, KalamAI shows its work. Every edit, suggestion, and rewrite is accompanied by a plain-language explanation — so you stay in control of your narrative and learn from every interaction.",
    tag: "Transparency",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/>
      </svg>
    ),
  },
  {
    number: "04",
    title: "Knowledge Graph",
    headline: "See the hidden architecture of your story.",
    body: "KalamAI builds a live visual map of your story's world — characters, locations, organisations, and the relationships between them. Watch your narrative universe take shape as you write, and spot missing connections before they become plot holes.",
    tag: "Visualization",
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
        <path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98"/>
      </svg>
    ),
  },
  // {
  //   number: "05",
  //   title: "Controlled Style Transformation",
  //   headline: "Shift tone without losing yourself.",
  //   body: "Need to make your thriller more suspenseful? Your romance more tender? Your literary fiction more accessible? KalamAI transforms your writing style on command — dramatic, casual, formal, poetic — while keeping the soul of your story intact.",
  //   tag: "Style",
  //   icon: (
  //     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
  //       <path d="M12 3c-4.97 0-9 4.03-9 9s4.03 9 9 9 9-4.03 9-9"/><path d="M18 3v6h-6"/>
  //     </svg>
  //   ),
  // },
  // {
  //   number: "06",
  //   title: "Character Persona Cards",
  //   headline: "Know your characters as deeply as your readers will.",
  //   body: "KalamAI automatically builds detailed persona cards for every character — tracking mentions, roles, relationships, and development arcs across your entire story. The people in your pages finally have a home.",
  //   tag: "Characters",
  //   icon: (
  //     <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
  //       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
  //       <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
  //     </svg>
  //   ),
  // },
];

function FeatureRow({ feature, index }: { feature: typeof FEATURES[0]; index: number }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  const isEven = index % 2 === 0;

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 60 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1], delay: 0.1 }}
      className="group"
      style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        gap: "0",
        borderTop: "1px solid rgba(201,140,80,0.15)",
        minHeight: "280px",
      }}
    >
      {/* Number + Tag side */}
      <div
        style={{
          padding: "3rem 3rem 3rem 0",
          borderRight: "1px solid rgba(201,140,80,0.15)",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          order: isEven ? 0 : 1,
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between" }}>
          <span style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "5rem", fontWeight: 400,
            color: "rgba(201,140,80,0.12)",
            lineHeight: 1, letterSpacing: "-0.04em",
            transition: "color 0.4s ease",
          }}
            className="group-hover:!text-[rgba(201,140,80,0.25)]"
          >
            {feature.number}
          </span>
          <motion.div
            style={{
              width: "52px", height: "52px",
              borderRadius: "14px",
              background: "rgba(201,140,80,0.08)",
              border: "1px solid rgba(201,140,80,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "#c98c50",
            }}
            whileHover={{ scale: 1.08, background: "rgba(201,140,80,0.15)" }}
            transition={{ type: "spring", stiffness: 400 }}
          >
            {feature.icon}
          </motion.div>
        </div>

        <div>
          <span style={{
            fontSize: "0.68rem", fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.12em",
            color: "#1a7a5e", padding: "0.3rem 0.75rem",
            background: "rgba(26,122,94,0.08)",
            borderRadius: "20px", border: "1px solid rgba(26,122,94,0.15)",
          }}>
            {feature.tag}
          </span>
        </div>
      </div>

      {/* Content side */}
      <div
        style={{
          padding: "3rem 0 3rem 3rem",
          display: "flex", flexDirection: "column", justifyContent: "center",
          order: isEven ? 1 : 0,
          paddingLeft: isEven ? "3rem" : "0",
          paddingRight: isEven ? "0" : "3rem",
          borderRight: isEven ? "none" : "1px solid rgba(201,140,80,0.15)",
        }}
      >
        <p style={{
          fontSize: "0.75rem", fontWeight: 600,
          textTransform: "uppercase", letterSpacing: "0.1em",
          color: "#c98c50", marginBottom: "0.75rem",
        }}>
          {feature.title}
        </p>
        <h3 style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: "clamp(1.3rem, 2.2vw, 1.75rem)",
          lineHeight: 1.25, color: "#1a120a",
          marginBottom: "1rem", letterSpacing: "-0.02em",
        }}>
          {feature.headline}
        </h3>
        <p style={{
          fontSize: "0.92rem", lineHeight: 1.75,
          color: "#6b5a4e", maxWidth: "480px",
        }}>
          {feature.body}
        </p>
      </div>
    </motion.div>
  );
}

 function Features() {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const isTitleInView = useInView(titleRef, { once: true, margin: "-60px" });

  return (
    <section
      ref={sectionRef}
      style={{ background: "#fdf5ee", padding: "6rem 0 8rem" }}
    >
      <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "0 2rem" }}>

        {/* ── Section header ── */}
        <div ref={titleRef} style={{ marginBottom: "5rem" }}>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.5 }}
            style={{
              fontSize: "0.72rem", fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.15em",
              color: "#1a7a5e", marginBottom: "1.25rem",
            }}
          >
            What KalamAI does
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: "clamp(2rem, 4vw, 3.2rem)",
              lineHeight: 1.15, color: "#1a120a",
              letterSpacing: "-0.03em", maxWidth: "700px",
              marginBottom: "1.5rem",
            }}
          >
            Not just an AI editor.{" "}
            <em style={{ color: "#c98c50", fontStyle: "italic" }}>
              A thinking partner
            </em>{" "}
            for serious writers.
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={isTitleInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            style={{
              fontSize: "1.05rem", color: "#6b5a4e",
              lineHeight: 1.7, maxWidth: "580px",
            }}
          >
            KalamAI is built for writers who take their craft seriously. 
            It doesn't just autocomplete — it understands your story, 
            remembers your world, and helps you write with intention.
          </motion.p>

          {/* Decorative line */}
          <motion.div
            initial={{ scaleX: 0 }}
            animate={isTitleInView ? { scaleX: 1 } : {}}
            transition={{ duration: 0.9, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
            style={{
              marginTop: "2.5rem",
              height: "1px",
              background: "linear-gradient(to right, #c98c50, rgba(201,140,80,0.1), transparent)",
              transformOrigin: "left",
            }}
          />
        </div>

        {/* ── Feature rows ── */}
        <div>
          {FEATURES.map((feature, index) => (
            <FeatureRow key={feature.number} feature={feature} index={index} />
          ))}
          {/* Bottom border */}
          <div style={{ borderTop: "1px solid rgba(201,140,80,0.15)" }} />
        </div>

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          style={{
            marginTop: "5rem", textAlign: "center",
            padding: "3.5rem",
            background: "rgba(201,140,80,0.05)",
            border: "1px solid rgba(201,140,80,0.15)",
            borderRadius: "20px",
          }}
        >
          <p style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: "clamp(1.4rem, 2.5vw, 2rem)",
            color: "#1a120a", marginBottom: "0.75rem",
            letterSpacing: "-0.02em",
          }}>
            Your story deserves more than spellcheck.
          </p>
          <p style={{ fontSize: "0.95rem", color: "#6b5a4e", marginBottom: "2rem" }}>
            Join writers who use KalamAI to write with clarity, consistency, and confidence.
          </p>
          <motion.button
            whileHover={{ scale: 1.03, background: "#156b52" }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400 }}
            style={{
              padding: "0.85rem 2.2rem", borderRadius: "50px",
              border: "none", background: "#1a7a5e",
              color: "#fff", fontSize: "0.9rem", fontWeight: 600,
              cursor: "pointer", letterSpacing: "0.02em",
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Start writing for free →
          </motion.button>
        </motion.div>
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Sans:wght@400;500;600&display=swap');
      `}</style>
    </section>
  );
}

export default Features;