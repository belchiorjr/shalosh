export default function Home() {
  return (
    <section className="space-y-6">
      <div className="rounded-2xl border border-default-200 bg-content1/70 p-6 backdrop-blur-md">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-foreground/60">
          Admin Dashboard
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-foreground">
          Welcome to Shalosh Admin
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-foreground/80">
          Monitor your operation pipeline and manage your internal resources in
          one place.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
            Input
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">128</p>
          <p className="mt-1 text-sm text-foreground/80">New entries today</p>
        </article>

        <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
            Process
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">86%</p>
          <p className="mt-1 text-sm text-foreground/80">Workflow completion</p>
        </article>

        <article className="rounded-2xl border border-default-200 bg-content1/70 p-5 backdrop-blur-md">
          <p className="text-xs uppercase tracking-[0.18em] text-foreground/60">
            Output
          </p>
          <p className="mt-2 text-2xl font-semibold text-foreground">74</p>
          <p className="mt-1 text-sm text-foreground/80">Generated results</p>
        </article>
      </div>
    </section>
  );
}
