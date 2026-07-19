// Hand-drawn speaker glyph (cone + two sound-wave arcs), not an emoji or an
// icon-font glyph -- a small self-contained vector image. Uses currentColor
// throughout so it automatically matches whatever text color the button
// it's placed in already uses (white on the accent-gradient play buttons,
// accent-colored on neutral-surface icon buttons), instead of needing a
// separate colored file per background.
export default function SpeakerIcon({ size = 16, className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M3 9.5C3 8.67157 3.67157 8 4.5 8H7L11.2929 3.70711C11.9229 3.07714 13 3.52331 13 4.41421V19.5858C13 20.4767 11.9229 20.9229 11.2929 20.2929L7 16H4.5C3.67157 16 3 15.3284 3 14.5V9.5Z"
        fill="currentColor"
      />
      <path
        d="M16 8.5C17 9.5 17.5 10.5 17.5 12C17.5 13.5 17 14.5 16 15.5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M18.5 6C20 7.5 21 9.5 21 12C21 14.5 20 16.5 18.5 18"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
