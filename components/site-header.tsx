import Link from "next/link";
import { FileStack } from "lucide-react";

const navItems = [
  { href: "/text-counter", label: "글자수" },
  { href: "/plain-text", label: "서식" },
  { href: "/date-calculator", label: "날짜" },
  { href: "/math", label: "수식" },
  { href: "/keyboard-converter", label: "오타" },
  { href: "/dummy-text", label: "더미" },
  { href: "/convert/image", label: "이미지" },
  { href: "/convert/pdf", label: "PDF" },
  { href: "/prompts", label: "프롬프트" },
  { href: "/account", label: "계정" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-bold tracking-tight"
        >
          <FileStack className="h-5 w-5" />
          <span>Report Tools</span>
        </Link>
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-md px-3 py-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
