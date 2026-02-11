"use client";

import { useEffect, useMemo, useState } from "react";
import NextLink from "next/link";
import clsx from "clsx";

const slides = [
  {
    id: "projeto-travado",
    title: "A solução que faltava para virar o jogo do seu projeto",
    description:
      "Se o seu sistema travou no meio do caminho, nós entramos para reorganizar escopo, tecnologia e execução até o lançamento.",
    tag: "Quando o projeto não dá certo",
    image:
      "https://images.unsplash.com/photo-1767972463898-e763a9f14995?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
    primaryCta: {
      label: "Quero destravar meu projeto",
      href: "/contato",
    },
  },
  {
    id: "sites",
    title: "Sites que convertem",
    description:
      "Consultoria e criação de sites institucionais, landing pages e portais com foco em performance, SEO e UX.",
    tag: "Consultoria e criação de sites",
    image:
      "https://images.unsplash.com/photo-1754379657900-962db3a86873?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "sistemas",
    title: "Sistemas sob medida",
    description:
      "Consultoria e criação de sistemas em geral, do discovery ao deploy, com arquitetura escalável e segura.",
    tag: "Consultoria e criação de sistemas",
    image:
      "https://images.unsplash.com/photo-1763568258235-f40425a94af9?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "desktop",
    title: "Software para Desktop",
    description:
      "Aplicações desktop com performance, integrações e experiência consistente em ambientes corporativos.",
    tag: "Software para Desktop",
    image:
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "mobile",
    title: "Apps Mobile que engajam",
    description:
      "Aplicativos iOS e Android com UX fluida, integrações críticas e foco em retenção.",
    tag: "App Mobile",
    image:
      "https://images.unsplash.com/photo-1633250391894-397930e3f5f2?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "ecommerce",
    title: "E-commerce que vende",
    description:
      "Consultoria e desenvolvimento de e-commerces com foco em conversão, checkout simples e integrações.",
    tag: "Consultoria e desenvolvimento de e-commerces",
    image:
      "https://images.unsplash.com/photo-1600414428654-bdee5b7af614?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "vps",
    title: "VPS sob controle",
    description:
      "Configurações de VPS, hardening, monitoramento e rotinas de backup para operação sem surpresas.",
    tag: "Configurações de VPS",
    image:
      "https://images.unsplash.com/photo-1654829903767-d7c3b3613697?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "legado",
    title: "Legado sem dor",
    description:
      "Ajustes em sistemas legados para ganhar estabilidade, corrigir bugs críticos e melhorar performance.",
    tag: "Ajustes em sistemas legados",
    image:
      "https://images.unsplash.com/photo-1699885960867-56d5f5262d38?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
  {
    id: "analise",
    title: "Análise e desenvolvimento",
    description:
      "Consultoria em análise e desenvolvimento de sistemas com alinhamento de negócio e tecnologia.",
    tag: "Consultoria em análise e desenvolvimento",
    image:
      "https://images.unsplash.com/photo-1758873268998-2f77c2d38862?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600",
  },
];

export function HeroCarousel() {
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 6500);

    return () => window.clearInterval(id);
  }, [paused]);

  const currentSlide = slides[active];

  const prev = () => {
    setActive((current) => (current - 1 + slides.length) % slides.length);
  };

  const next = () => {
    setActive((current) => (current + 1) % slides.length);
  };

  const slideLabel = useMemo(
    () => `${active + 1} de ${slides.length}`,
    [active],
  );

  const primaryCta = currentSlide.primaryCta ?? {
    label: "Fale com a Shalosh",
    href: "/contato",
  };
  const secondaryCta = currentSlide.secondaryCta ?? {
    label: "Ver serviços",
    href: "/services",
  };

  return (
    <section
      aria-label="Carrossel de serviços"
      aria-roledescription="carousel"
      className="relative overflow-hidden rounded-3xl border border-default-100/40 bg-[#0b0c0f] h-[440px] sm:h-[500px] lg:h-[580px]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <div className="absolute inset-0">
        <img
          src={currentSlide.image}
          alt={currentSlide.title}
          className="h-full w-full object-cover opacity-55"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/55 to-black/25" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,196,0,0.2),_transparent_45%)]" />
      </div>

      <div className="relative z-10 flex h-full flex-col justify-between gap-10 px-6 py-12 md:px-12">
        <div className="max-w-3xl space-y-5">
          <span className="inline-flex items-center rounded-full border border-[#FFC400]/40 bg-[#FFC400]/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-[#FFC400]">
            {currentSlide.tag}
          </span>
          <h1 className="text-4xl font-semibold tracking-tight text-white md:text-6xl lg:text-6xl">
            {currentSlide.title}
          </h1>
          <p className="text-sm text-white/80 md:text-lg">
            {currentSlide.description}
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <NextLink
              className="inline-flex items-center rounded-full bg-[#FFC400] px-5 py-2 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#ffd44d]"
              href={primaryCta.href}
            >
              {primaryCta.label}
            </NextLink>
            <NextLink
              className="inline-flex items-center rounded-full border border-white/40 px-5 py-2 text-sm font-semibold text-white/90 transition-colors hover:border-white hover:text-white"
              href={secondaryCta.href}
            >
              {secondaryCta.label}
            </NextLink>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            {slides.map((slide, index) => (
              <button
                key={slide.id}
                aria-label={`Ir para ${slide.title}`}
                aria-pressed={index === active}
                className={clsx(
                  "h-1.5 rounded-full transition-all",
                  index === active
                    ? "w-10 bg-[#FFC400]"
                    : "w-5 bg-white/40 hover:bg-white/70",
                )}
                onClick={() => setActive(index)}
                type="button"
              />
            ))}
          </div>
          <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.2em] text-white/70">
            <span>{slideLabel}</span>
            <div className="flex items-center gap-2">
              <button
                className="rounded-full border border-white/30 px-3 py-1 transition-colors hover:border-white/70"
                onClick={prev}
                type="button"
              >
                Anterior
              </button>
              <button
                className="rounded-full border border-white/30 px-3 py-1 transition-colors hover:border-white/70"
                onClick={next}
                type="button"
              >
                Próximo
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
