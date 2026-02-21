"use client";

import { motion } from "framer-motion";
import {
  Brain,
  Layers,
  Sliders,
  Eye,
  Zap,
  Shield,
} from "lucide-react";
import { staggerContainer } from "@/lib/animations";
import Card from "@/components/ui/Card";

const features = [
  {
    icon: Brain,
    title: "Narrative Consistency",
    desc: "Detect character, timeline, and context mismatches across long content.",
  },
  {
    icon: Layers,
    title: "Structure & Flow",
    desc: "Reorder sections and improve transitions intelligently.",
  },
  {
    icon: Sliders,
    title: "Controlled Style",
    desc: "Shift tone without losing your authentic voice.",
  },
  {
    icon: Eye,
    title: "Explainable Changes",
    desc: "Every edit comes with a clear rationale.",
  },
  {
    icon: Zap,
    title: "Fast & Focused",
    desc: "Real-time suggestions without breaking flow.",
  },
  {
    icon: Shield,
    title: "Custom Core Logic",
    desc: "No black-box prompt engineering. Full transparency.",
  },
];

 function Features() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-7xl px-6">
        <h2 className="text-center text-3xl font-serif font-semibold">
          Built for writers who care about craft
        </h2>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          className="mt-16 grid gap-8 md:grid-cols-3"
        >
          {features.map((f, i) => (
            <Card key={i}>
              <f.icon className="h-6 w-6 text-emerald-700" />
              <h3 className="mt-4 font-medium">{f.title}</h3>
              <p className="mt-2 text-sm text-gray-600">{f.desc}</p>
            </Card>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
export default Features;