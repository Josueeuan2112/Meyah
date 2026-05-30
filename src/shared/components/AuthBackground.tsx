export default function AuthBackground() {
  return (
    <div
      className="fixed inset-0 pointer-events-none overflow-hidden"
      aria-hidden="true"
    >
      {/* Esquina superior derecha */}
      <div className="hidden md:block absolute top-[-40px] right-[-40px] text-meyah-terracota-500 opacity-[0.04]">
        <svg
          width="280"
          height="280"
          viewBox="0 0 280 280"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="140" cy="140" r="125" stroke="currentColor" strokeWidth="2" />
          <circle cx="140" cy="140" r="95" stroke="currentColor" strokeWidth="2" />
          <circle cx="140" cy="140" r="65" stroke="currentColor" strokeWidth="2" />
          <circle cx="140" cy="140" r="35" stroke="currentColor" strokeWidth="2" />
          <line x1="140" y1="15" x2="140" y2="265" stroke="currentColor" strokeWidth="2" />
          <line x1="15" y1="140" x2="265" y2="140" stroke="currentColor" strokeWidth="2" />
          <rect
            x="90"
            y="90"
            width="100"
            height="100"
            transform="rotate(45 140 140)"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>

      {/* Esquina inferior izquierda */}
      <div className="hidden md:block absolute bottom-[-40px] left-[-40px] text-meyah-terracota-500 opacity-[0.04]">
        <svg
          width="220"
          height="220"
          viewBox="0 0 220 220"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle cx="110" cy="110" r="95" stroke="currentColor" strokeWidth="2" />
          <circle cx="110" cy="110" r="65" stroke="currentColor" strokeWidth="2" />
          <circle cx="110" cy="110" r="35" stroke="currentColor" strokeWidth="2" />
          <line x1="110" y1="15" x2="110" y2="205" stroke="currentColor" strokeWidth="2" />
          <line x1="15" y1="110" x2="205" y2="110" stroke="currentColor" strokeWidth="2" />
          <rect
            x="65"
            y="65"
            width="90"
            height="90"
            transform="rotate(45 110 110)"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
          />
        </svg>
      </div>
    </div>
  )
}
