// // "use client";

// // import { motion } from "framer-motion";
// // import Badge from "@/components/ui/Badge";
// // import Button from "@/components/ui/Button";
// // import { fadeUp } from "@/lib/animations";

// //  function Hero() {
// //   return (
// //     <section className="bg-gradient-to-br from-emerald-50 via-white to-sky-50">
// //       <div className="mx-auto max-w-4xl px-6 py-32 text-center">
// //         <motion.div variants={fadeUp} initial="hidden" animate="visible">
// //           <Badge text="AI-powered writing assistant" />
// //         </motion.div>

// //         <motion.h1
// //           variants={fadeUp}
// //           initial="hidden"
// //           animate="visible"
// //           className="mt-6 text-5xl font-serif font-semibold leading-tight"
// //         >
// //           Make your writing{" "}
// //           <span className="text-emerald-700">
// //             consistent. compelling. clear.
// //           </span>
// //         </motion.h1>

// //         <p className="mx-auto mt-6 max-w-2xl text-gray-600">
// //           KalamAI improves structure, tracks narrative consistency,
// //           and explains every change it makes.
// //         </p>

// //         <div className="mt-10 flex justify-center gap-4">
// //           <Button>Start for free</Button>
// //           <Button variant="secondary">See how it works</Button>
// //         </div>
// //       </div>
// //     </section>
// //   );
// // }

// // export default Hero;



// "use client";

// import { motion } from "framer-motion";
// import Badge from "@/components/ui/Badge";
// import Button from "@/components/ui/Button";
// import { fadeUp } from "@/lib/animations";

// // 👉 Skiper UI
// // import { CrowdCanvas } from "@/components/ui/skiper-ui/v1/skiper39";
// import { CrowdCanvas } from "@/components/ui/skiper-ui/skiper39";

// function Hero() {
//   return (
//     <section className="relative overflow-hidden">
      
//       {/* ── Background: Skiper Crowd Canvas ── */}
//       <div className="absolute inset-0 z-0">
//         <CrowdCanvas
//           src="/images/peeps/all-peeps.png"
//           rows={6}
//           cols={4}
//           className="h-full w-full opacity-[0.08]"
//         />
//         {/* Soft overlay for readability */}
//         <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white" />
//       </div>

//       {/* ── Foreground Content ── */}
//       <div className="relative z-10 mx-auto max-w-4xl px-6 py-32 text-center">
//         <motion.div variants={fadeUp} initial="hidden" animate="visible">
//           <Badge text="AI-powered writing assistant" />
//         </motion.div>

//         <motion.h1
//           variants={fadeUp}
//           initial="hidden"
//           animate="visible"
//           className="mt-6 text-5xl font-serif font-semibold leading-tight"
//         >
//           Every Story Is a Puzzle. 
//           <span className="text-emerald-700">
//             Qalam AI Solves It
//           </span>
//         </motion.h1>

//         <p className="mx-auto mt-6 max-w-2xl text-gray-600">
//           KalamAI improves structure, tracks narrative consistency,
//           and explains every change it makes.
//         </p>

//         <div className="mt-10 flex justify-center gap-4">
//           <Button>Start for free</Button>
//           <Button variant="secondary">See how it works</Button>
//         </div>
//       </div>
//     </section>
//   );
// }

// export default Hero;






"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";
import { CrowdCanvas } from "@/components/ui/skiper-ui/skiper39";

function Hero() {
  return (
    <section className="relative overflow-hidden" style={{ background: "#fdf5ee", minHeight: "100vh" }}>

      {/* ── Subtle radial glow for depth ── */}
      <div
        className="absolute inset-0 z-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 50% 30%, rgba(201,140,80,0.08) 0%, transparent 70%)",
        }}
      />

      {/* ── Foreground Content ── */}
      <div className="relative z-10 mx-auto max-w-4xl px-6 pt-32 pb-0 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Badge text="AI-powered writing assistant" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 font-serif font-semibold leading-tight"
          style={{ fontSize: "clamp(2.4rem, 5vw, 3.6rem)", color: "#1a120a" }}
        >
          Every Story Is a Puzzle.{" "}
          <span style={{ color: "#1a7a5e" }}>
            KalamAI Solves It
          </span>
        </motion.h1>

        <motion.p
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mx-auto mt-6 max-w-2xl"
          style={{ color: "#6b5a4e", fontSize: "1.05rem", lineHeight: 1.7 }}
        >
          KalamAI improves structure, tracks narrative consistency,
          and explains every change it makes.
        </motion.p>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-10 flex justify-center gap-4"
        >
          <Button>Start for free</Button>
          <Button variant="secondary">See how it works</Button>
        </motion.div>
      </div>

      {/* ── CrowdCanvas pinned to bottom — people walk on the "ground" ── */}
      <div
        className="absolute bottom-0 left-0 w-full z-10 pointer-events-none"
        style={{ height: "38vh" }}
      >
        {/* Ground fade — makes it look like they're standing on the page */}
        <div
          className="absolute inset-x-0 bottom-0 z-20"
          style={{
            height: "35%",
            background: "linear-gradient(to top, #fdf5ee 0%, transparent 100%)",
          }}
        />
        {/* Top fade — characters emerge from behind content */}
        <div
          className="absolute inset-x-0 top-0 z-20"
          style={{
            height: "30%",
            background: "linear-gradient(to bottom, #fdf5ee 0%, transparent 100%)",
          }}
        />
        <div style={{ opacity: 0.13, height: "100%", width: "100%" }}>
          <CrowdCanvas
            src="/images/peeps/all-peeps.png"
            rows={6}
            cols={4}
          />
        </div>
      </div>

    </section>
  );
}

export default Hero;




