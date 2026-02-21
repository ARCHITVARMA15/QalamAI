"use client";

import { motion } from "framer-motion";
import { Upload, Search, Wand2, Download } from "lucide-react";

const steps = [
  {
    icon: Upload,
    title: "Upload your draft",
    desc: "Paste or upload long-form content.",
  },
  {
    icon: Search,
    title: "Deep analysis",
    desc: "Entities, timelines, tone, and structure are mapped.",
  },
  {
    icon: Wand2,
    title: "Apply enhancements",
    desc: "Accept or reject suggestions one by one.",
  },
  {
    icon: Download,
    title: "Export polished content",
    desc: "Download clean, improved copy.",
  },
];

 function HowItWorks() {
  return (
    <section className="py-24">
      <div className="mx-auto max-w-5xl px-6">
        <h2 className="text-center text-3xl font-serif font-semibold">
          From rough draft to polished prose
        </h2>

        <div className="mt-16 space-y-12">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              className="flex gap-6"
            >
              <step.icon className="h-6 w-6 text-emerald-700" />
              <div>
                <h3 className="font-medium">{step.title}</h3>
                <p className="text-sm text-gray-600">{step.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default HowItWorks;