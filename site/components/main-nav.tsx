"use client";

import NextLink from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";

import { MailIcon } from "@/components/icons";

const navLinks = [
  { href: "/about", label: "Sobre" },
  { href: "/services", label: "Serviços" },
  { href: "/cases", label: "Cases" },
];

export function MainNav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-6 text-sm font-medium h-10">
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
      <NextLink
        className={clsx(
          "inline-flex items-center rounded-full px-4 py-1.5 text-sm font-medium leading-none transition-colors bg-[#FFC400] text-black hover:bg-[#ffd44d] dark:border dark:border-[#FFC400]/50 dark:bg-transparent dark:text-[#FFC400] dark:hover:bg-[#FFC400] dark:hover:text-black",
          pathname === "/contato" &&
            "ring-2 ring-[#FFC400]/70 ring-offset-2 ring-offset-background",
        )}
        href="/contato"
      >
        <MailIcon className="mr-2" size={16} />
        Contato
      </NextLink>
    </nav>
  );
}
