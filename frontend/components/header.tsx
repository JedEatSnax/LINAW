"use client";
import { cn } from "@/lib/utils";
import { useScroll } from "@/hooks/use-scroll";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/mobile-nav";
import Link from "next/link";

export const navLinks = [
  {
    label: "Features",
    href: "#",
  },
  {
    label: "About",
    href: "#",
  },
];

export function Header() {
  const scrolled = useScroll(10);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 mx-auto w-full max-w-4xl border-transparent border-b md:rounded-md md:border md:transition-all md:ease-out",
        {
          "border-border bg-background/95 backdrop-blur-sm supports-backdrop-filter:bg-background/50 md:top-2 md:max-w-3xl md:shadow":
            scrolled,
        },
      )}
    >
      <nav
        className={cn(
          "flex h-14 w-full items-center justify-between px-4 md:h-12 md:transition-all md:ease-out",
          {
            "md:px-2": scrolled,
          },
        )}
      >
        <div className="hidden items-center gap-2 md:flex">
          {navLinks.map((link) => (
            <Button
              key={link.label}
              size="sm"
              variant="ghost"
              render={<a href={link.href} />}
              nativeButton={false}
            >
              {link.label}
            </Button>
          ))}
        </div>
        <div className="hidden items-center gap-2 md:flex">
          <Link href="/signup" passHref>
            <Button size="sm" variant="outline">
              Signup
            </Button>
          </Link>
          <Link href="/login" passHref>
            <Button size="sm">Login</Button>
          </Link>
        </div>
        <MobileNav />
      </nav>
    </header>
  );
}
