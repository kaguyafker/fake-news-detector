import { Globe } from "lucide-react";

interface SourceLogoProps {
  source: string;
  className?: string;
}

const sourceLogos: Record<string, { bg: string; text: string; label: string }> = {
  reuters: { bg: "bg-orange-500", text: "text-white", label: "R" },
  bbc: { bg: "bg-black", text: "text-white", label: "BBC" },
  ap: { bg: "bg-red-600", text: "text-white", label: "AP" },
  aljazeera: { bg: "bg-amber-600", text: "text-white", label: "AJ" },
  cnn: { bg: "bg-red-700", text: "text-white", label: "CNN" },
  nytimes: { bg: "bg-black", text: "text-white", label: "NYT" },
  guardian: { bg: "bg-blue-900", text: "text-yellow-400", label: "G" },
  washingtonpost: { bg: "bg-black", text: "text-white", label: "WP" },
  npr: { bg: "bg-blue-600", text: "text-white", label: "NPR" },
  afp: { bg: "bg-blue-800", text: "text-white", label: "AFP" },
};

export function SourceLogo({ source, className = "" }: SourceLogoProps) {
  const normalizedSource = source.toLowerCase().replace(/[^a-z]/g, "");
  
  // Find matching source
  const matchedKey = Object.keys(sourceLogos).find(key => 
    normalizedSource.includes(key)
  );

  if (matchedKey) {
    const logo = sourceLogos[matchedKey];
    return (
      <span 
        className={`inline-flex items-center justify-center h-5 px-1.5 rounded text-xs font-bold ${logo.bg} ${logo.text} ${className}`}
      >
        {logo.label}
      </span>
    );
  }

  return <Globe className={`h-4 w-4 text-muted-foreground ${className}`} />;
}
