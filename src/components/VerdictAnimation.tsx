import { useEffect } from "react";
import { motion, Transition } from "framer-motion";
import confetti from "canvas-confetti";

interface VerdictAnimationProps {
  verdict: "True" | "False" | "Uncertain";
  children: React.ReactNode;
}

export function VerdictAnimation({ verdict, children }: VerdictAnimationProps) {
  useEffect(() => {
    if (verdict === "True") {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#22c55e", "#16a34a", "#15803d"],
      });
    }
  }, [verdict]);

  if (verdict === "True") {
    return (
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 } as Transition}
      >
        {children}
      </motion.div>
    );
  }

  if (verdict === "False") {
    return (
      <motion.div
        initial={{ x: 0 }}
        animate={{ x: [0, -10, 10, -10, 10, 0] }}
        transition={{ duration: 0.5 }}
      >
        {children}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0.5 }}
      animate={{ opacity: [0.5, 1, 0.5] }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {children}
    </motion.div>
  );
}
