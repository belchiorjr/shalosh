const insights = [
  {
    title: "Planejamento técnico para crescimento",
    description:
      "Como organizar o roadmap para suportar novas demandas sem perder qualidade.",
  },
  {
    title: "Governança em sistemas legados",
    description:
      "Práticas para manter sistemas antigos estáveis e prontos para evolução.",
  },
  {
    title: "Infra segura e previsível",
    description:
      "O que considerar em configurações de VPS e ambientes críticos.",
  },
];

export default function BlogPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Insights
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Conteúdo para apoiar decisões
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Artigos e notas sobre tecnologia aplicada ao negócio.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {insights.map((item) => (
          <article
            key={item.title}
            className="rounded-2xl border border-default-100/40 bg-background/80 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              {item.description}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
