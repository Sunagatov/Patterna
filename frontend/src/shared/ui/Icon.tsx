const paths = {
  copy: (
    <>
      <rect x="8" y="8" width="12" height="13" rx="2" />
      <path d="M16 8V3H3v13h5" />
    </>
  ),
  chevronLeft: <path d="m15 6-6 6 6 6" />,
  code: <path d="m8 7-5 5 5 5m8-10 5 5-5 5M14 4l-4 16" />,
  file: (
    <>
      <path d="M14 3H5v18h14V8zM14 3v5h5M8 12h8M8 16h6" />
    </>
  ),
  arrowLeft: <path d="M20 12H4m6-6-6 6 6 6" />,
  search: (
    <>
      <circle cx="10.8" cy="10.8" r="6.8" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  bookmark: <path d="M6.5 3.5h11v17l-5.5-3.8-5.5 3.8z" />,
  list: <path d="M4 6h16M4 12h16M4 18h16" />,
  groupedList: (
    <path d="m4 5 2 2-2 2m6-2h10M4 11l2 2-2 2m6-2h10m-16 4 2 2-2 2m6-2h10" />
  ),
  star: (
    <path d="m12 3 2.8 5.7 6.3.9-4.6 4.5 1.1 6.3-5.6-3-5.6 3 1.1-6.3L3 9.6l6.2-.9z" />
  ),
  chevronDown: <path d="m6 9 6 6 6-6" />,
  chevronRight: <path d="m9 6 6 6-6 6" />,
  arrowUpRight: <path d="M6 18 18 6M6 6h12v12" />,
  arrowUp: <path d="M12 20V4m-6 6 6-6 6 6" />,
  arrowRight: <path d="M4 12h16m-6-6 6 6-6 6" />,
  sliders: (
    <>
      <path d="M4 6h8m4 0h4M4 12h2m4 0h10M4 18h10m4 0h2" />
      <circle cx="14" cy="6" r="2" />
      <circle cx="8" cy="12" r="2" />
      <circle cx="16" cy="18" r="2" />
    </>
  ),
  x: <path d="m6 6 12 12M6 18 18 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  repeat: (
    <path d="M17 2.5 21 6l-4 3.5M21 6H7a4 4 0 0 0-4 4m4 11.5L3 18l4-3.5M3 18h14a4 4 0 0 0 4-4" />
  ),
  trash: <path d="M3 6h18M9 6V3h6v3M6 6l1 15h10l1-15M10 10v7m4-7v7" />,
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
  moon: <path d="M20.8 13.1A8.9 8.9 0 0 1 10.9 3.2 9 9 0 1 0 20.8 13.1Z" />,
  coffee: (
    <>
      <path d="M5 7h12l-1 13H6L5 7ZM4 4h14M9 4V2m5 2V2M17 9h2a3 3 0 0 1 0 6h-2" />
      <path d="M4 22h15" />
    </>
  ),
  github: (
    <path d="M9 19c-4.4 1.4-4.4-2-6.2-2.5M15.5 22v-3.4c0-.9-.3-1.7-.8-2.2 2.8-.3 5.8-1.4 5.8-6.2a4.8 4.8 0 0 0-1.3-3.3 4.5 4.5 0 0 0-.1-3.3s-1.1-.4-3.5 1.3a12 12 0 0 0-6.4 0C6.8 3.2 5.7 3.6 5.7 3.6a4.5 4.5 0 0 0-.1 3.3 4.8 4.8 0 0 0-1.3 3.3c0 4.8 3 5.9 5.8 6.2-.5.5-.8 1.3-.8 2.2V22" />
  ),
  telegram: <path d="m21 3-4 18-6-5-4 4 1-7-6-3zM8 13 21 3M11 16l6-9" />,
  linkedin: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M7 10v7M7 7v.1M11 17v-7m0 3a3 3 0 0 1 6 0v4" />
    </>
  ),
};

export type IconName = keyof typeof paths;

export function Icon({
  name,
  className = "",
}: {
  name: IconName;
  className?: string;
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}
