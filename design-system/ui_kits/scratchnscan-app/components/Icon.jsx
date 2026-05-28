// Icon set — verbatim mirror of the inline SVGs used in app/index.html.
// All icons inherit currentColor; size & color from the parent style.

const _iconPaths = {
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10" /></>,
  scan: <><rect x="3" y="6" width="18" height="14" rx="3" /><circle cx="12" cy="13" r="3.5" /><path d="M8 6V4h8v2" /></>,
  pencil: <><path d="M4 20h4l11-11-4-4L4 16z" /><path d="m14 5 4 4" /></>,
  star: <path d="m12 3 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.8 6.8 19.1l1-5.8L3.5 9.2l5.9-.9z" />,
  search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
  bowl: <><path d="M4 14a8 8 0 1 1 16 0" /><path d="M2 14h20l-2 7H4z" /></>,
  image: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="8.5" cy="10" r="1.6" /><path d="m4 17 5-5 4 4 3-3 4 4" /></>,
  spark: <path d="M12 3c1 3-1 4-1 6a3 3 0 0 0 6 0c0-1 0-2-.5-3 2 1.5 3.5 4 3.5 7a8 8 0 1 1-16 0c0-4 3-6 4-9 1 1 1 2 1 3" />,
  dots: <><circle cx="12" cy="6" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="18" r="1.6" /></>,
  emptyBowl: <><path d="M4 11a8 8 0 1 1 16 0" /><path d="M2 11h20l-2 8H4z" /></>,
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {_iconPaths[name]}
    </svg>
  );
}

function BrandMark({ size = 28 }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} focusable="false" aria-hidden="true">
      <defs>
        <linearGradient id="snsBrand" x1="6" y1="6" x2="42" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#fff3bf" />
          <stop offset="1" stopColor="#caa85d" />
        </linearGradient>
      </defs>
      <path d="M9 23h30c-1.3 10.3-7.2 17-15 17S10.3 33.3 9 23Z" fill="url(#snsBrand)" />
      <path d="M11 21c3.7-4.6 22.3-4.6 26 0" fill="none" stroke="#fff8dc" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 9 21 18" stroke="#fff8dc" strokeWidth="3.4" strokeLinecap="round" />
      <circle cx="32" cy="8" r="3.4" fill="#caa85d" />
    </svg>
  );
}

window.Icon = Icon;
window.BrandMark = BrandMark;
