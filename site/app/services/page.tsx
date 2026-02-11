import {
  AnalyticsIcon,
  CommerceIcon,
  DesktopIcon,
  MobileIcon,
  ServerIcon,
  SystemsIcon,
  WebsiteIcon,
  WrenchIcon,
} from "@/components/icons";

const serviceList = [
  {
    title: "Consultoria e criação em sites",
    description:
      "Sites institucionais, landing pages e portais com foco em conversão, SEO e performance.",
    icon: WebsiteIcon,
  },
  {
    title: "Consultoria e criação de sistemas",
    description:
      "Sistemas sob medida com integrações, segurança e escalabilidade.",
    icon: SystemsIcon,
  },
  {
    title: "Software para Desktop",
    description:
      "Aplicações desktop estáveis, com integrações e experiência consistente.",
    icon: DesktopIcon,
  },
  {
    title: "Apps Mobile",
    description:
      "Aplicativos iOS e Android com foco em usabilidade e retenção.",
    icon: MobileIcon,
  },
  {
    title: "Consultoria e desenvolvimento de e-commerces",
    description:
      "Plataformas de venda com checkout otimizado, catálogo escalável e integrações.",
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
      "Correções de bugs, refatorações e melhorias para manter a operação estável.",
    icon: WrenchIcon,
  },
  {
    title: "Consultoria em análise e desenvolvimento",
    description:
      "Mapeamento de requisitos, documentação e governança das entregas.",
    icon: AnalyticsIcon,
  },
];

export default function ServicesPage() {
  return (
    <div className="internal-page">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Serviços
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Soluções completas em tecnologia
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Cada serviço é adaptado ao contexto do seu negócio, com foco em
          resultado e sustentabilidade técnica.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {serviceList.map((service) => {
          const Icon = service.icon;

          return (
            <div
              key={service.title}
              className="rounded-2xl border border-default-100/40 bg-background/80 p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/10 text-[#FFC400]">
                  <Icon size={20} />
                </span>
                <h2 className="text-lg font-semibold text-foreground">
                  {service.title}
                </h2>
              </div>
              <p className="mt-2 text-sm text-foreground/70">
                {service.description}
              </p>
            </div>
          );
        })}
      </section>
    </div>
  );
}
