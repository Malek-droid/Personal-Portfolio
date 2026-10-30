import { cn } from "@/lib/utils";

export interface MbMonogramProps {
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
  withGlow?: boolean;
}

const SIZES = {
  xs: { box: 22, rx: 5 },
  sm: { box: 28, rx: 7 },
  md: { box: 36, rx: 9 },
  lg: { box: 48, rx: 12 },
};

export function MbMonogram({ size = "sm", className }: MbMonogramProps) {
  const { box } = SIZES[size];

  return (
    <div
      className={cn(
        "inline-flex items-center justify-center select-none group relative transition-transform duration-200 hover:scale-105 shrink-0",
        className
      )}
      style={{ width: box, height: box }}
      aria-label="MB Monogram"
    >
      <svg
        width={box}
        height={box}
        viewBox="0 0 36 36"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible"
      >
        <defs>
          <linearGradient id="mbBorderGrad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3f3f46" />
            <stop offset="100%" stopColor="#7c3aed" stopOpacity="0.7" />
          </linearGradient>
        </defs>

        {/* Squircle base */}
        <rect
          x="1"
          y="1"
          width="34"
          height="34"
          rx="8"
          fill="#0c0c0e"
          stroke="url(#mbBorderGrad)"
          strokeWidth="1.5"
          className="transition-all duration-300 group-hover:stroke-[#8b5cf6]"
        />

        {/* Monogram letters: M (white) + B (violet) */}
        <g
          fontFamily="'Space Mono', ui-monospace, monospace"
          fontWeight="700"
          fontSize="14"
          letterSpacing="-0.5px"
        >
          <text x="6.5" y="23" fill="#ffffff">
            M
          </text>
          <text
            x="18.5"
            y="23"
            fill="#a78bfa"
            className="transition-colors duration-300 group-hover:fill-[#c4b5fd]"
          >
            B
          </text>
        </g>
      </svg>
    </div>
  );
}

