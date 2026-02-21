"use client";

import { motion } from "framer-motion";

 function Testimonials() {
  return (
    <section className="bg-gray-50 py-24">
      <div className="mx-auto max-w-4xl px-6 text-center">
        <h2 className="text-3xl font-serif font-semibold">
          Words from writers we love
        </h2>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-12 rounded-2xl bg-white p-10 shadow"
        >
          <p className="text-gray-700">
            “KalamAI helped me restructure a 10,000-word thesis
            with complete transparency. I always knew why a change
            was suggested.”
          </p>
          <div className="mt-6 text-sm text-gray-500">
            — Research Scholar
          </div>
        </motion.div>
      </div>
    </section>
  );
}
export default Testimonials;