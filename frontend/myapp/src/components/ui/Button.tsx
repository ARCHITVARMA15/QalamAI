"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";

type ButtonProps = {
  children: React.ReactNode;
  variant?: "primary" | "secondary";
};

 function Button({
  children,
  variant = "primary",
}: ButtonProps) {
  const styles = {
    primary:
      "bg-emerald-700 text-white hover:bg-emerald-800",
    secondary:
      "border border-emerald-700 text-emerald-700 hover:bg-emerald-50",
  };

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition ${styles[variant]}`}
    >
      {children}
      <ArrowRight size={16} />
    </motion.button>
  );
}

export default Button;