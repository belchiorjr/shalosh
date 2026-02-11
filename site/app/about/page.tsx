import {
  BuildIcon,
  DeployIcon,
  DesignIcon,
  DiscoveryIcon,
  EyeIcon,
  InputIcon,
  OutputIcon,
  ProcessIcon,
  StrategyIcon,
  TargetIcon,
  TestIcon,
} from "@/components/icons";

const systemParts = [
  {
    title: "Entrada",
    description: "Dados, demandas e sinais capturados do negócio.",
    icon: InputIcon,
  },
  {
    title: "Processamento",
    description: "Regras, validações e inteligência aplicada ao fluxo.",
    icon: ProcessIcon,
  },
  {
    title: "Saída",
    description: "Decisões, automações e resultados para o time.",
    icon: OutputIcon,
  },
];

const deliverySteps = [
  {
    title: "Discovery",
    description: "Imersão, entrevistas e mapeamento do problema real.",
    icon: DiscoveryIcon,
  },
  {
    title: "Estratégia",
    description: "Priorização, escopo e alinhamento com metas do negócio.",
    icon: StrategyIcon,
  },
  {
    title: "Design",
    description: "Jornadas, protótipos e experiência orientada ao usuário.",
    icon: DesignIcon,
  },
  {
    title: "Desenvolvimento",
    description: "Arquitetura, código e integrações com foco em escala.",
    icon: BuildIcon,
  },
  {
    title: "QA e ajustes",
    description: "Testes, refinamentos e validações antes do lançamento.",
    icon: TestIcon,
  },
  {
    title: "Deploy",
    description: "Publicação segura, monitoramento e evolução contínua.",
    icon: DeployIcon,
  },
];

export default function AboutPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Sobre
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Shalosh Tecnologia da Informação
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Somos uma empresa de tecnologia focada em consultoria e desenvolvimento
          de soluções digitais que sustentam o crescimento do negócio.
        </p>
      </header>

      <section className="space-y-8">
        <div className="space-y-6">
          <div className="space-y-3">
            <h2 className="text-xl font-semibold text-foreground">
              Por que Shalosh?
            </h2>
            <p className="text-sm text-foreground/70 md:text-base">
              Shalosh significa 3 em hebraico. O nome representa o ciclo que
              sustenta qualquer sistema: entrada, processamento e saída. Nós
              desenhamos esse fluxo para transformar dados em decisões e
              resultados claros.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {systemParts.map((part) => {
              const Icon = part.icon;

              return (
                <div
                  key={part.title}
                  className="rounded-2xl border border-[#FFC400]/40 bg-[#FFC400]/10 p-6 shadow-lg shadow-[#FFC400]/10"
                >
                  <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/20 text-[#FFC400]">
                    <Icon size={20} />
                  </span>
                  <h3 className="mt-4 text-base font-semibold text-foreground">
                    {part.title}
                  </h3>
                  <p className="mt-2 text-sm text-foreground/80">
                    {part.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-default-100/40 bg-background/80 p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/10 text-[#FFC400]">
              <TargetIcon size={20} />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Missão</h2>
          </div>
          <p className="mt-3 text-sm text-foreground/70">
            Traduzir desafios de negócio em tecnologia eficiente, segura e
            escalável.
          </p>
        </div>
        <div className="rounded-2xl border border-default-100/40 bg-background/80 p-6">
          <div className="flex items-center gap-3">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/10 text-[#FFC400]">
              <EyeIcon size={20} />
            </span>
            <h2 className="text-lg font-semibold text-foreground">Visão</h2>
          </div>
          <p className="mt-3 text-sm text-foreground/70">
            Ser referência em projetos digitais que geram impacto real e
            sustentável.
          </p>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">Como atuamos</h2>
          <p className="text-sm text-foreground/70 md:text-base">
            Atuamos em ciclos curtos, com alto envolvimento no início do projeto
            e acompanhamento contínuo para garantir previsibilidade e qualidade.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {deliverySteps.map((step) => {
            const Icon = step.icon;

            return (
              <div
                key={step.title}
                className="rounded-2xl border border-default-100/40 bg-background/80 p-5"
              >
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-2xl bg-[#FFC400]/10 text-[#FFC400]">
                  <Icon size={20} />
                </span>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {step.title}
                </h3>
                <p className="mt-2 text-xs text-foreground/70">
                  {step.description}
                </p>
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}
