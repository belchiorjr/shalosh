const cases = [
  {
    title: "Clínicas e laboratórios",
    description:
      "Sistemas para agenda médica, prontuários, laudos e integração com convênios.",
    focus: "Saúde e atendimento",
  },
  {
    title: "Varejo e franquias",
    description:
      "PDV, estoque, precificação e painéis de vendas em tempo real.",
    focus: "Operação omnicanal",
  },
  {
    title: "Indústrias e manufatura",
    description:
      "Controle de produção, rastreabilidade e qualidade no chão de fábrica.",
    focus: "Eficiência produtiva",
  },
  {
    title: "Logística e transportes",
    description:
      "Roteirização, tracking e dashboards de entregas para operações críticas.",
    focus: "Rotas e visibilidade",
  },
  {
    title: "Educação e treinamento",
    description:
      "Gestão acadêmica, matrículas, conteúdos e comunicação com alunos.",
    focus: "Experiência do aluno",
  },
  {
    title: "Imobiliárias e condomínios",
    description:
      "Contratos, cobrança, gestão de ativos e portais de autoatendimento.",
    focus: "Gestão de contratos",
  },
  {
    title: "Restaurantes e food service",
    description:
      "Pedidos integrados, cozinha organizada e fidelização de clientes.",
    focus: "Operação ágil",
  },
  {
    title: "Serviços financeiros e contábeis",
    description:
      "Conciliação, relatórios e segurança para operações sensíveis.",
    focus: "Governança e compliance",
  },
];

export default function CasesPage() {
  return (
    <div className="internal-page">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Cases
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Resultados que ganham forma
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Alguns exemplos de entregas e frentes de trabalho que atendemos com
          confidencialidade e foco em impacto.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {cases.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-default-100/40 bg-background/80 p-6"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[#FFC400]">
              {item.focus}
            </p>
            <h2 className="mt-3 text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </div>
  );
}
