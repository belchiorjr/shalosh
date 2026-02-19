"use client";

import { Button } from "@heroui/button";
import Link from "next/link";

import { MaterialSymbol } from "@/components/material-symbol";

export default function ApiConnectionErrorPage() {
  return (
    <main className="flex min-h-screen items-center justify-center px-6 py-10">
      <section className="w-full max-w-xl rounded-2xl border border-default-200 bg-content1/80 p-8 text-center shadow-[0_1px_2px_rgba(0,0,0,0.05)] backdrop-blur-md">
        <div className="mx-auto mb-5 flex h-24 w-24 items-center justify-center rounded-full border border-danger/30 bg-danger/10">
          <span className="relative inline-flex">
            <MaterialSymbol
              name="smart_toy"
              className="text-[52px] text-danger"
              filled
            />
            <MaterialSymbol
              name="close"
              className="absolute -right-2 -top-2 rounded-full bg-danger px-1 py-1 text-[16px] text-white"
            />
          </span>
        </div>

        <h1 className="text-2xl font-semibold text-foreground">API indisponível</h1>
        <p className="mt-3 text-sm text-foreground/75">
          Não foi possível conectar ao backend no momento. Verifique se a API está em
          execução e tente novamente.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            color="primary"
            startContent={<MaterialSymbol name="refresh" className="text-[18px]" />}
            onPress={() => {
              window.location.reload();
            }}
          >
            Tentar novamente
          </Button>

          <Button
            as={Link}
            href="/login"
            variant="flat"
            startContent={<MaterialSymbol name="login" className="text-[18px]" />}
          >
            Ir para login
          </Button>
        </div>
      </section>
    </main>
  );
}
