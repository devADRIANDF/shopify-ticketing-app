export function TicketIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        d="M4 4h16v4a2 2 0 0 1 0 4v4a2 2 0 0 1 0 4H4v-4a2 2 0 0 1 0-4V4z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function QRIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      strokeWidth="2"
      stroke="currentColor"
      fill="none"
      viewBox="0 0 24 24"
      className={className}
    >
      <path
        d="M4 4h4v4H4zM16 4h4v4h-4zM4 16h4v4H4zM11 11h1v1h-1zM14 14h6v6h-6z"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
