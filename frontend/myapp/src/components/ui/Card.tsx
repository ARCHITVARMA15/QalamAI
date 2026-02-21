"use client";

import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";

 function Card({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <motion.div
      variants={fadeUp}
      className="rounded-2xl bg-white p-6 shadow-sm hover:shadow-md transition"
    >
      {children}
    </motion.div>
  );
}
export default Card;