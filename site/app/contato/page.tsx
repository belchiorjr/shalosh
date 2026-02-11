import { InspirationalMessage } from "@/components/inspirational-message";

export default function ContatoPage() {
  return (
    <div className="internal-page">
      <section className="grid gap-6">
        <div
          className="relative h-[460px] overflow-hidden rounded-2xl border border-default-100/40 md:h-[640px]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1752659504453-fe55d292efb9?auto=format&fit=crop&fm=jpg&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&ixlib=rb-4.1.0&q=80&w=1600')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/60" aria-hidden="true" />
          <div className="relative z-10 flex h-full flex-col gap-8 p-8 md:p-10">
            <div className="space-y-3 md:max-w-xl">
              <p className="text-xs font-semibold uppercase tracking-[0.25em] text-white/70">
                Contato
              </p>
              <h1 className="text-3xl font-semibold text-white md:text-4xl">
                Vamos conversar sobre o seu projeto
              </h1>
              <p className="max-w-lg text-sm text-white/80 md:text-base">
                Conte-nos o que você precisa e retornaremos com uma proposta de
                caminho e cronograma.
              </p>
            </div>
            <div className="mt-auto space-y-3 md:self-end md:text-right">
              <h2 className="text-xl font-semibold text-white">
                Atendimento via WhatsApp
              </h2>
              <p className="max-w-md text-sm text-white/80 md:text-base md:ml-auto">
                Para agilizar, fale direto com nosso time pelo WhatsApp.
              </p>
              <a
                className="inline-flex w-fit items-center rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black shadow-sm transition-colors hover:bg-[#1ebe5d] md:ml-auto"
                href="https://wa.me/5541984387354"
                rel="noreferrer"
                target="_blank"
              >
                Chamar no WhatsApp
              </a>
            </div>
          </div>
        </div>
        <InspirationalMessage />
      </section>
    </div>
  );
}
