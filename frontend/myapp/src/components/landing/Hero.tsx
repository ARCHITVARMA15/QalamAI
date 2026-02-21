"use client";

import { motion } from "framer-motion";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import { fadeUp } from "@/lib/animations";

 function Hero() {
  return (
    <section className="bg-gradient-to-br from-emerald-50 via-white to-sky-50">
      <div className="mx-auto max-w-4xl px-6 py-32 text-center">
        <motion.div variants={fadeUp} initial="hidden" animate="visible">
          <Badge text="AI-powered writing assistant" />
        </motion.div>

        <motion.h1
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          className="mt-6 text-5xl font-serif font-semibold leading-tight"
        >
          Make your writing{" "}
          <span className="text-emerald-700">
            consistent. compelling. clear.
          </span>
        </motion.h1>

        <p className="mx-auto mt-6 max-w-2xl text-gray-600">
          KalamAI improves structure, tracks narrative consistency,
          and explains every change it makes.
        </p>

        <div className="mt-10 flex justify-center gap-4">
          <Button>Start for free</Button>
          <Button variant="secondary">See how it works</Button>
        </div>
      </div>
    </section>
  );
}

export default Hero;