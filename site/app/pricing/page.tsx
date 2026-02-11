const models = [
  {
    title: "Projeto fechado",
    description:
      "Ideal para escopo definido, com cronograma e entregas alinhadas desde o início.",
  },
  {
    title: "Time dedicado",
    description:
      "Squad alocado para evolução contínua, com prioridades definidas em ciclos.",
  },
  {
    title: "Pacote de melhorias",
    description:
      "Horas mensais para ajustes, manutenções e evoluções pontuais.",
  },
];

export default function PricingPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Modelos
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Formatos de trabalho flexíveis
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Ajustamos o modelo conforme o nível de maturidade e urgência do seu
          projeto.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-3">
        {models.map((model) => (
          <article
            key={model.title}
            className="rounded-2xl border border-default-100/40 bg-background/80 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {model.title}
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              {model.description}
            </p>
          </article>
        ))}
      </section>
    </>
  );
}
