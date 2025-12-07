import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export function FloatingActionButton() {
  const navigate = useNavigate();

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-50"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
    >
      <Button
        onClick={() => navigate("/verify")}
        size="lg"
        className="h-14 w-14 rounded-full shadow-lg bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-300 hover:scale-110"
      >
        <Plus className="h-6 w-6" />
        <span className="sr-only">New Check</span>
      </Button>
    </motion.div>
  );
}
