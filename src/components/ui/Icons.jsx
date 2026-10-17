/*
 * A small hand-drawn icon set on a 24px grid at 1.6 stroke — light enough to sit
 * beside Geist text without shouting, and it keeps an icon library out of the
 * bundle for the fifteen glyphs this product actually uses.
 */

function Svg({ children, size = 20, ...props }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const ScanIcon = (p) => (
  <Svg {...p}>
    <path d="M4 9V6a2 2 0 0 1 2-2h3M20 9V6a2 2 0 0 0-2-2h-3M4 15v3a2 2 0 0 0 2 2h3M20 15v3a2 2 0 0 1-2 2h-3" />
    <path d="M3.5 12h17" />
  </Svg>
);

export const QrIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <path d="M13.5 13.5h3v3h-3zM20.5 13.5v3M17.5 20.5h3M13.5 20.5h1" />
  </Svg>
);

export const CheckIcon = (p) => (
  <Svg {...p}>
    <path d="m4.5 12.5 5 5 10-11" />
  </Svg>
);

export const XIcon = (p) => (
  <Svg {...p}>
    <path d="m6 6 12 12M18 6 6 18" />
  </Svg>
);

export const PlusIcon = (p) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
);

export const SearchIcon = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="m20 20-3.6-3.6" />
  </Svg>
);

export const UploadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 16V4.5M8 8l4-4 4 4" />
    <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const DownloadIcon = (p) => (
  <Svg {...p}>
    <path d="M12 4v11.5M8 12l4 4 4-4" />
    <path d="M4.5 15v3a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-3" />
  </Svg>
);

export const TrashIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1.5 1.5 0 0 1 1.5-1.5h2a1.5 1.5 0 0 1 1.5 1.5V7" />
    <path d="M6.5 7l.8 11.6a2 2 0 0 0 2 1.9h5.4a2 2 0 0 0 2-1.9L17.5 7" />
    <path d="M10.5 11v6M13.5 11v6" />
  </Svg>
);

export const EditIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 19.5h15" />
    <path d="M6 16.5 16.2 6.3a2 2 0 0 1 2.8 0l-.3-.3a2 2 0 0 1 0 2.8L8.5 19H6v-2.5Z" />
  </Svg>
);

export const CalendarIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="15" rx="2.5" />
    <path d="M3.5 10h17M8 3.5v4M16 3.5v4" />
  </Svg>
);

export const PinIcon = (p) => (
  <Svg {...p}>
    <path d="M12 21s6.5-6.1 6.5-10.5a6.5 6.5 0 1 0-13 0C5.5 14.9 12 21 12 21Z" />
    <circle cx="12" cy="10.5" r="2.4" />
  </Svg>
);

export const SunIcon = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.2 5.2l1.4 1.4M17.4 17.4l1.4 1.4M18.8 5.2l-1.4 1.4M6.6 17.4l-1.4 1.4" />
  </Svg>
);

export const MoonIcon = (p) => (
  <Svg {...p}>
    <path d="M20 14.2A8.2 8.2 0 0 1 9.8 4 8.3 8.3 0 1 0 20 14.2Z" />
  </Svg>
);

export const CameraIcon = (p) => (
  <Svg {...p}>
    <path d="M3.5 8.5A2 2 0 0 1 5.5 6.5h1.8l1.2-2h7l1.2 2h1.8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-13a2 2 0 0 1-2-2Z" />
    <circle cx="12" cy="12.5" r="3.4" />
  </Svg>
);

export const SwitchCameraIcon = (p) => (
  <Svg {...p}>
    <path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" />
    <path d="M17.5 3v3.5H14M6.5 21v-3.5H10" />
  </Svg>
);

export const VolumeIcon = (p) => (
  <Svg {...p}>
    <path d="M5 9.5h3l4-3.5v12l-4-3.5H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="M16 9.5a3.5 3.5 0 0 1 0 5M18.5 7a7 7 0 0 1 0 10" />
  </Svg>
);

export const MuteIcon = (p) => (
  <Svg {...p}>
    <path d="M5 9.5h3l4-3.5v12l-4-3.5H5a1 1 0 0 1-1-1v-3a1 1 0 0 1 1-1Z" />
    <path d="m16 10 4 4M20 10l-4 4" />
  </Svg>
);

export const ExpandIcon = (p) => (
  <Svg {...p}>
    <path d="M9 4.5H4.5V9M15 4.5h4.5V9M9 19.5H4.5V15M15 19.5h4.5V15" />
  </Svg>
);

export const ShrinkIcon = (p) => (
  <Svg {...p}>
    <path d="M4.5 9H9V4.5M19.5 9H15V4.5M4.5 15H9v4.5M19.5 15H15v4.5" />
  </Svg>
);

export const CloudOffIcon = (p) => (
  <Svg {...p}>
    <path d="M7.5 18.5h9a4 4 0 0 0 .7-7.9A5.5 5.5 0 0 0 8.2 8" />
    <path d="M7.5 18.5a3.5 3.5 0 0 1-.6-6.9" />
    <path d="m4 4 16 16" />
  </Svg>
);

export const SyncIcon = (p) => (
  <Svg {...p}>
    <path d="M20 11a8 8 0 0 0-13.7-5.2M4 13a8 8 0 0 0 13.7 5.2" />
    <path d="M20 4.5V9h-4.5M4 19.5V15h4.5" />
  </Svg>
);

export const UsersIcon = (p) => (
  <Svg {...p}>
    <circle cx="9.5" cy="8.5" r="3.5" />
    <path d="M3.5 19.5a6 6 0 0 1 12 0" />
    <path d="M16 5.6a3.5 3.5 0 0 1 0 5.8M17.5 19.5a6 6 0 0 0-1.6-4.1" />
  </Svg>
);

export const LogOutIcon = (p) => (
  <Svg {...p}>
    <path d="M14.5 4.5h3a2 2 0 0 1 2 2v11a2 2 0 0 1-2 2h-3" />
    <path d="M10 8.5 6.5 12l3.5 3.5M6.5 12h8" />
  </Svg>
);

export const ArrowLeftIcon = (p) => (
  <Svg {...p}>
    <path d="M10 5.5 3.5 12l6.5 6.5M4 12h16" />
  </Svg>
);

export const MailIcon = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5.5" width="17" height="13" rx="2.5" />
    <path d="m4.5 8 6.4 4.6a2 2 0 0 0 2.2 0L19.5 8" />
  </Svg>
);

export const PrinterIcon = (p) => (
  <Svg {...p}>
    <path d="M7 9V4.5h10V9" />
    <path d="M7 17.5H5.5a2 2 0 0 1-2-2V11a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2v4.5a2 2 0 0 1-2 2H17" />
    <rect x="7" y="14" width="10" height="6" rx="1.2" />
  </Svg>
);
