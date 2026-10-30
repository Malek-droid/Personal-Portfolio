import { cn } from "@/lib/utils";

interface CatMarkProps {
  size?: number;
  className?: string;
  ariaLabel?: string;
}

/**
 * CatMark — reusable cat avatar mark for cards and headers.
 * Uses the crisp vector cat icon from /favicon.svg with rounded squircle/circle styling.
 */
export function CatMark({
  size = 40,
  className,
  ariaLabel = "Malek's cat logo",
}: CatMarkProps) {
  return (
    <div
      className={cn(
        "rounded-full bg-[#0a0a0c] border border-[#7c3aed]/40 flex items-center justify-center overflow-hidden flex-shrink-0 select-none shadow-[0_0_10px_rgba(124,58,237,0.2)]",
        className
      )}
      style={{ width: size, height: size }}
      role="img"
      aria-label={ariaLabel}
    >
      <img
        src="/favicon.svg"
        alt=""
        aria-hidden="true"
        width={size}
        height={size}
        className="w-full h-full object-cover select-none pointer-events-none"
        loading="eager"
        decoding="async"
      />
    </div>
  );
}

