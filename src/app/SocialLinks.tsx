import { Instagram, Linkedin, Music2 } from "lucide-react";

const socialLinks = [
  { label: "Instagram", handle: "@anovra.africa", href: "https://www.instagram.com/anovra.africa/", Icon: Instagram },
  { label: "X", handle: "@anovraHQ", href: "https://x.com/anovraHQ", Icon: null },
  { label: "LinkedIn", handle: "Anovra Africa", href: "https://www.linkedin.com/company/anovra-africa/", Icon: Linkedin },
  { label: "TikTok", handle: "@anovra.africa", href: "https://www.tiktok.com/@anovra.africa", Icon: Music2 },
];

export function SocialLinks({ compact = false }: { compact?: boolean }) {
  return (
    <div className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2"}>
      {socialLinks.map(({ label, handle, href, Icon }) => (
        <a
          key={label}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`${label}: ${handle} (opens in a new tab)`}
          title={`${label} ${handle}`}
          className="inline-flex min-h-10 items-center justify-center gap-2 rounded-md border border-current/20 px-3 py-2 text-sm font-medium transition-colors hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-current"
        >
          {Icon ? <Icon aria-hidden="true" className="h-4 w-4 shrink-0" /> : <span aria-hidden="true" className="w-4 text-center font-bold">X</span>}
          {!compact && <span className="truncate">{label}</span>}
        </a>
      ))}
    </div>
  );
}
