type Props = { variant?: "base" | "r" | "c" };

const HEAD =
  "M100 150 Q70 150 56 134 Q44 120 46 96 L50 64 L44 14 L80 46 Q100 40 120 46 L156 14 L150 64 L154 96 Q156 120 144 134 Q130 150 100 150 Z";
const SHOULDERS = "M100 150 Q72 150 66 162 Q40 170 22 200 L178 200 Q160 170 134 162 Q128 150 100 150 Z";

// Sparse de-rez particles: [x, y, w, h]
const PARTICLES: [number, number, number, number][] = [
  [60, 206, 2, 2], [84, 210, 14, 1], [118, 208, 2, 2], [140, 212, 10, 1], [72, 218, 2, 2],
  [100, 220, 2, 2], [126, 222, 8, 1], [52, 226, 6, 1], [92, 230, 2, 2], [112, 234, 12, 1],
  [80, 240, 2, 2], [134, 242, 2, 2], [98, 248, 6, 1], [66, 252, 2, 2], [120, 256, 2, 2],
  [104, 262, 4, 1], [88, 266, 1.5, 1.5],
];

export function CatSvg({ variant = "base" }: Props) {
  const tint = variant === "r" ? "#7c3aed" : variant === "c" ? "#22d3ee" : null;
  const rim = tint ?? "#7c3aed";
  const id = `nc-${variant}`;
  return (
    <svg viewBox="0 0 200 270" className="cat-img" aria-hidden={variant !== "base" ? true : undefined} role={variant === "base" ? "img" : undefined}>
      {variant === "base" && <title>Silhouette of a cat with glowing eyes</title>}
      <defs>
        <radialGradient id={`${id}-fill`} cx="35%" cy="30%" r="80%">
          <stop offset="0%" stopColor="#141020" />
          <stop offset="60%" stopColor="#0d0a14" />
          <stop offset="100%" stopColor="#07060c" />
        </radialGradient>
        <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor={tint ?? "#a78bfa"} />
          <stop offset="45%" stopColor={rim} />
          <stop offset="100%" stopColor={rim} stopOpacity="0.25" />
        </linearGradient>
        <linearGradient id={`${id}-fade`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" />
          <stop offset="55%" stopColor="#fff" />
          <stop offset="100%" stopColor="#000" />
        </linearGradient>
        <mask id={`${id}-mask`}>
          <rect x="0" y="140" width="200" height="62" fill={`url(#${id}-fade)`} />
          <rect x="0" y="0" width="200" height="150" fill="#fff" />
        </mask>
        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="2" result="b" />
          <feMerge><feMergeNode in="b" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <g mask={`url(#${id}-mask)`}>
        <path d={SHOULDERS} fill={`url(#${id}-fill)`} stroke={`url(#${id}-rim)`} strokeWidth="1.2" filter={`url(#${id}-glow)`} />
        <path d={HEAD} fill={`url(#${id}-fill)`} stroke={`url(#${id}-rim)`} strokeWidth="1.4" strokeLinejoin="round" filter={`url(#${id}-glow)`} />
      </g>
      {/* Inner ear rims */}
      <path d="M52 26 L56 60 L74 46 Z" fill="none" stroke={rim} strokeOpacity="0.55" strokeWidth="0.8" />
      <path d="M148 26 L144 60 L126 46 Z" fill="none" stroke={rim} strokeOpacity="0.25" strokeWidth="0.8" />
      {/* Nose hairline */}
      <path d="M97 112 L100 115 L103 112" fill="none" stroke={rim} strokeOpacity="0.35" strokeWidth="0.7" strokeLinecap="round" />
      {variant === "base" && (
        <>
          <g className="ncat-eye" filter={`url(#${id}-glow)`}>
            <path d="M64 92 Q76 82 92 88 Q80 98 64 92 Z" fill="#9cc7e0" />
            <path className="ncat-pupil" d="M78 85 Q76 90.5 78 96 Q80 90.5 78 85 Z" fill="#07060c" />
          </g>
          <g className="ncat-eye" filter={`url(#${id}-glow)`}>
            <path d="M136 92 Q124 82 108 88 Q120 98 136 92 Z" fill="#e0b97a" />
            <path className="ncat-pupil" d="M122 85 Q120 90.5 122 96 Q124 90.5 122 85 Z" fill="#07060c" />
          </g>
          <g fill="#7c3aed">
            {PARTICLES.map(([x, y, w, h], i) => (
              <rect key={i} x={x} y={y} width={w} height={h} className="ncat-particle"
                style={{ opacity: Math.max(0.15, 0.85 - (y - 204) / 80), animationDelay: `${(i * 0.53) % 4}s` }} />
            ))}
          </g>
        </>
      )}
    </svg>
  );
}

const GLYPHS: [string, number, number, number][] = [
  ["</>", -6, 8, 0], ["01", 98, 40, 2.4], [">_", 2, 78, 4.2],
];

export function MysticCat() {
  return (
    <div className="cat-wrap">
      <div className="ncat-haze" />
      <div className="ncat-orbit" />
      <div className="ncat-float">
        <div className="ncat-stage">
          <CatSvg />
          <div className="ncat-split ncat-r"><CatSvg variant="r" /></div>
          <div className="ncat-split ncat-c"><CatSvg variant="c" /></div>
          <div className="ncat-slice"><CatSvg /></div>
          <div className="cat-scan" />
        </div>
      </div>
      {GLYPHS.map(([g, l, t, d], i) => (
        <span key={i} className="ncat-glyph" style={{ left: `${l}%`, top: `${t}%`, animationDelay: `${d}s` }}>{g}</span>
      ))}
    </div>
  );
}
