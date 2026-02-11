import NextLink from "next/link";

import { HeroCarousel } from "@/components/hero-carousel";
import {
  AnalyticsIcon,
  CommerceIcon,
  DesktopIcon,
  MobileIcon,
  ServerIcon,
  ShieldIcon,
  SystemsIcon,
  WebsiteIcon,
  WrenchIcon,
} from "@/components/icons";

const services = [
  {
    title: "Consultoria e criação em sites",
    description:
      "Discovery, UX, UI e desenvolvimento com foco em conversão, SEO e velocidade.",
    icon: WebsiteIcon,
  },
  {
    title: "Consultoria e criação de sistemas",
    description:
      "Arquitetura, APIs e integrações para sistemas sob medida e escaláveis.",
    icon: SystemsIcon,
  },
  {
    title: "Software para Desktop",
    description:
      "Aplicações desktop com performance, integrações e suporte a fluxos críticos.",
    icon: DesktopIcon,
  },
  {
    title: "Apps Mobile",
    description:
      "Aplicativos iOS e Android com UX fluida, testes e evolução contínua.",
    icon: MobileIcon,
  },
  {
    title: "Consultoria e desenvolvimento de e-commerces",
    description:
      "Checkout fluido, integrações com ERP e evolução contínua do catálogo.",
    icon: CommerceIcon,
  },
  {
    title: "Configurações de VPS",
    description:
      "Provisionamento, hardening, backups e monitoramento para alta disponibilidade.",
    icon: ServerIcon,
  },
  {
    title: "Ajustes em sistemas legados",
    description:
      "Correções pontuais, refatorações e atualizações para manter o negócio rodando.",
    icon: WrenchIcon,
  },
  {
    title: "Consultoria em análise e desenvolvimento",
    description:
      "Mapeamento de requisitos, roadmap técnico e governança de entregas.",
    icon: AnalyticsIcon,
  },
  {
    title: "Segurança e conformidade",
    description:
      "Auditoria, LGPD e proteção de dados críticos com processos sólidos.",
    icon: ShieldIcon,
  },
];

const processSteps = [
  {
    title: "Diagnóstico rápido",
    description:
      "Imersão no negócio, leitura do ambiente atual e definição de prioridades.",
  },
  {
    title: "Entrega com foco",
    description:
      "Squad enxuto, metas claras e acompanhamento contínuo do andamento.",
  },
  {
    title: "Evolução contínua",
    description:
      "Monitoramento, melhorias incrementais e suporte para o ciclo de vida.",
  },
];

const focusAreas = [
  "Performance e escalabilidade",
  "Segurança e continuidade",
  "Automação de processos",
  "Integrações críticas",
  "Experiência do usuário",
  "Observabilidade e dados",
];

export default function Home() {
  return (
    <div className="flex flex-col gap-16 pb-16">
      <HeroCarousel />

      <section className="space-y-8">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
            Serviços principais
          </p>
          <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
            Tecnologia aplicada ao que gera resultado
          </h2>
          <p className="max-w-2xl text-sm text-foreground/70 md:text-base">
            Unimos consultoria, desenvolvimento e operação para entregar projetos
            seguros, rápidos e sustentáveis.
          </p>
        </div>
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {services.map((service) => {
            const Icon = service.icon;

            return (
              <div
                key={service.title}
                className="rounded-2xl border border-default-100/40 bg-background/80 p-6 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/10 text-[#FFC400]">
                    <Icon size={20} />
                  </span>
                  <h3 className="text-lg font-semibold text-foreground">
                    {service.title}
                  </h3>
                </div>
                <p className="mt-2 text-sm text-foreground/70">
                  {service.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-3xl border border-default-100/40 bg-gradient-to-br from-[#11131a] via-[#0d0f14] to-[#0b0c0f] p-8 md:p-10">
        <div className="grid gap-8 md:grid-cols-3">
          {processSteps.map((step) => (
            <div key={step.title} className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#FFC400]">
                {step.title}
              </p>
              <p className="text-sm text-white/80">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-semibold text-foreground md:text-3xl">
          Foco no que importa para o seu negócio
        </h2>
        <div className="flex flex-wrap gap-3">
          {focusAreas.map((area) => (
            <span
              key={area}
              className="rounded-full border border-default-100/40 bg-background/70 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/70"
            >
              {area}
            </span>
          ))}
        </div>
      </section>

      <section className="flex flex-col items-start justify-between gap-6 rounded-3xl border border-default-100/40 bg-[#0b0c0f] p-8 md:flex-row md:items-center">
        <div className="space-y-3">
          <h2 className="text-2xl font-semibold text-white md:text-3xl">
            Pronto para evoluir seu projeto?
          </h2>
          <p className="max-w-2xl text-sm text-white/70 md:text-base">
            Conte com a Shalosh para estruturar, desenvolver e manter a sua
            operação digital em alto nível.
          </p>
        </div>
        <NextLink
          className="inline-flex items-center rounded-full bg-[#FFC400] px-6 py-3 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#ffd44d]"
          href="/contato"
        >
          Falar com especialista
        </NextLink>
      </section>
    </div>
  );
}
