type IconProps = { className?: string };

export function IconShield({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 2.5 5 5.75v5.9c0 4.55 2.98 8.8 7 10.35 4.02-1.55 7-5.8 7-10.35v-5.9L12 2.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M9.2 12.1 11.1 14l3.9-4.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function IconGlobe({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="8.5" stroke="currentColor" strokeWidth="1.5" />
      <path d="M3.5 12h17M12 3.5c2.2 2.6 3.5 5.7 3.5 8.5S14.2 17.9 12 20.5M12 3.5C9.8 6.1 8.5 9.2 8.5 12s1.3 5.9 3.5 8.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconAlert({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 4.25 4.5 18h15L12 4.25Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M12 9.5v4.25M12 16.75h.01" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

export function IconAnalytics({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M5 18V10M10 18V6M15 18v-5M20 18V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M4 18h16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconReputation({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M12 3.5 14.8 9l6.2.5-4.7 3.9 1.5 6-5.8-3.6-5.8 3.6 1.5-6-4.7-3.9 6.2-.5L12 3.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconLock({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="6" y="10" width="12" height="9.5" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8.5 10V8a3.5 3.5 0 0 1 7 0v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconCalendar({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="4.5" y="6" width="15" height="13" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M8 4.5V7M16 4.5V7M4.5 10h15" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconPhishing({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4.5 8.5h15v9a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="m4.5 8.5 7.5 6 7.5-6" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

export function IconReports({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M7 4.5h7.2L18.5 8.8V19a1.5 1.5 0 0 1-1.5 1.5H7A1.5 1.5 0 0 1 5.5 19V6A1.5 1.5 0 0 1 7 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      <path d="M14 4.5V9h4.5M9 12.5h6M9 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSpark({ className = "h-5 w-5" }: IconProps) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5 13.4 9.6 19.5 11 13.4 12.4 12 18.5 10.6 12.4 4.5 11 10.6 9.6 12 3.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </svg>
  );
}
