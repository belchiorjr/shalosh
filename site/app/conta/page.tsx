export default function ContaPage() {
  return (
    <div className="internal-page">
      <header className="space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-foreground/60">
          Sua conta
        </p>
        <h1 className="text-3xl font-semibold text-foreground md:text-4xl">
          Área do cliente
        </h1>
        <p className="text-sm text-foreground/70 md:text-base">
          Acompanhe projetos, entregas e suporte com visibilidade total.
        </p>
      </header>

      <section className="rounded-2xl border border-default-100/40 bg-background/80 p-6">
        <h2 className="text-lg font-semibold text-foreground">
          Acesso rápido
        </h2>
        <p className="mt-2 text-sm text-foreground/70">
          Em breve, acesso com login e indicadores em tempo real. Se precisar de
          suporte imediato, fale com nosso time pelo formulário de contato.
        </p>
      </section>
    </div>
  );
}
