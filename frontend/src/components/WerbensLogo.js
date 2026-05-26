export function WerbensLogo({ className = "", showWordmark = true, markClassName = "" }) {
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <img
        src="/app/werbens-logo.svg"
        alt=""
        aria-hidden="true"
        className={`h-9 w-auto shrink-0 ${markClassName}`}
      />
      {showWordmark && (
        <span className="font-display gradient-text block text-[1.65rem] font-bold leading-none sm:text-[1.9rem]">
          Werbens
        </span>
      )}
    </span>
  );
}
