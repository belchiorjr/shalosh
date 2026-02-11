export default function DocsPage() {
  return (
    <>
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Metodologia
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Como entregamos projetos
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Transparência, colaboração e entregas incrementais são os pilares do
          nosso processo.
        </p>
      </header>

      <section className="grid gap-6 md:grid-cols-2">
        {[
          {
            title: "Discovery e alinhamento",
            description:
              "Levantamento de requisitos, objetivos e riscos para definir o caminho.",
          },
          {
            title: "Arquitetura e protótipos",
            description:
              "Definição técnica, fluxos e protótipos para reduzir incertezas.",
          },
          {
            title: "Desenvolvimento e testes",
            description:
              "Implementação com revisões, testes e monitoramento contínuo.",
          },
          {
            title: "Entrega e evolução",
            description:
              "Treinamento, documentação e backlog para melhorias contínuas.",
          },
        ].map((item) => (
          <div
            key={item.title}
            className="rounded-2xl border border-default-100/40 bg-background/80 p-6"
          >
            <h2 className="text-lg font-semibold text-foreground">
              {item.title}
            </h2>
            <p className="mt-2 text-sm text-foreground/70">
              {item.description}
            </p>
          </div>
        ))}
      </section>
    </>
  );
}
