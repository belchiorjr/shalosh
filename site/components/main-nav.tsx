"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

const navLinks = [
  { href: "/about", label: "Sobre" },
  { href: "/services", label: "Serviços" },
  { href: "/cases", label: "Cases" },
  { href: "/contato", label: "Contato" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap items-center gap-4 text-sm font-medium leading-none sm:flex-nowrap sm:gap-6 sm:h-10">
      {navLinks.map((link) => {
        const isActive = pathname === link.href;

        return (
          <NextLink
            key={link.href}
            className={clsx(
              "relative pb-2 text-foreground/80 hover:text-[#FFC400] transition-colors leading-none",
              isActive &&
                "text-[#FFC400] after:absolute after:left-0 after:right-0 after:-bottom-1 after:h-0.5 after:rounded-full after:bg-[#FFC400] after:content-['']",
            )}
            href={link.href}
          >
            {link.label}
          </NextLink>
        );
      })}
    </nav>
  );
}
