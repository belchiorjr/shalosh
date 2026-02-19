"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Input } from "@heroui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useState } from "react";

import { MaterialSymbol } from "@/components/material-symbol";
import { ThemeSwitch } from "@/components/theme-switch";
import { ClientApiError, fetchClientApi } from "@/lib/client-api";
import { saveClientProfile, writeClientTokenCookie } from "@/lib/client-auth";

interface AuthSuccessResponse {
  token: string;
  tokenType?: string;
  expiresAt?: string;
  client?: {
    id: string;
    name: string;
    email: string;
    login: string;
    avatar?: string;
  };
}

export default function LoginPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <LoginPageContent />
    </Suspense>
  );
}

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [mode, setMode] = useState<"login" | "register">("login");
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const destination = searchParams.get("from") || "/";

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const payload =
        mode === "login"
          ? { login: login.trim(), password: password.trim() }
          : {
              login: login.trim(),
              password: password.trim(),
              name: name.trim(),
              email: email.trim(),
            };

      const response = await fetchClientApi<AuthSuccessResponse>(
        mode === "login" ? "/client-auth/login" : "/client-auth/register",
        {
          method: "POST",
          body: JSON.stringify(payload),
        },
        { auth: false },
      );

      if (!response.token || !response.client?.id) {
        setError("Resposta inválida da API.");
        setIsSubmitting(false);
        return;
      }

      writeClientTokenCookie(response.token, response.expiresAt);
      saveClientProfile({
        id: response.client.id,
        name: response.client.name || login.trim(),
        email: response.client.email || "",
        login: response.client.login || login.trim(),
        avatar: response.client.avatar || "",
      });

      router.replace(destination);
      router.refresh();
    } catch (requestError) {
      if (requestError instanceof ClientApiError) {
        setError(requestError.message);
      } else {
        setError("Falha de conexão com a API.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 via-blue-50 to-cyan-50 p-4 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <img
          src="/shalosh_logo.svg"
          alt=""
          className="absolute left-1/2 top-1/2 h-[34vh] w-auto -translate-x-1/2 -translate-y-1/2 opacity-10"
        />
      </div>
      <div className="absolute right-4 top-4 z-10 rounded-full border border-default-200 bg-content1/80 p-1 backdrop-blur">
        <ThemeSwitch />
      </div>
      <Card className="relative z-10 w-full max-w-5xl overflow-hidden border border-default-200 bg-content1/90 backdrop-blur-md">
        <CardBody className="p-0">
          <div className="grid md:grid-cols-[1fr_420px]">
            <div className="flex flex-col items-center justify-center gap-4 bg-white/30 px-6 py-10 dark:bg-black">
              <div className="relative w-56 sm:w-64 md:w-72">
                <img
                  src="/shalosh_marca_x.svg"
                  alt="Shalosh"
                  className="h-auto w-full dark:hidden"
                />
                <img
                  src="/shalosh_marca_x_dark.svg"
                  alt="Shalosh"
                  className="hidden h-auto w-full dark:block"
                />
              </div>
              <p className="max-w-sm text-center text-xs leading-tight text-foreground/70 dark:text-white/80">
                Soluções digitais para acompanhar seus projetos
                <br />
                de ponta a ponta.
              </p>
            </div>

            <div className="flex flex-col justify-center p-6 md:min-h-[560px]">
              <div className="w-full space-y-4">
                <header className="space-y-1 text-center">
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">
                    Portal do Cliente
                  </p>
                  <h1 className="text-2xl font-semibold text-foreground">
                    {mode === "login" ? "Entrar na conta" : "Criar conta"}
                  </h1>
                  <p className="text-sm text-foreground/70">
                    {mode === "login"
                      ? "Acompanhe seus projetos, pagamentos e solicitações."
                      : "Cadastro básico com login e senha."}
                  </p>
                </header>

                <form className="space-y-3" onSubmit={handleSubmit}>
                  {mode === "register" ? (
                    <Input
                      label="Nome (opcional)"
                      value={name}
                      onValueChange={setName}
                      placeholder="Seu nome"
                    />
                  ) : null}

                  {mode === "register" ? (
                    <Input
                      label="Email (opcional)"
                      value={email}
                      onValueChange={setEmail}
                      placeholder="seuemail@dominio.com"
                      type="email"
                    />
                  ) : null}

                  <Input
                    label="Login"
                    value={login}
                    onValueChange={setLogin}
                    placeholder="Informe seu login"
                    isRequired
                  />

                  <Input
                    label="Senha"
                    value={password}
                    onValueChange={setPassword}
                    placeholder="Informe sua senha"
                    type="password"
                    isRequired
                  />

                  {error ? <p className="text-sm font-medium text-danger">{error}</p> : null}

                  <Button
                    type="submit"
                    color="primary"
                    className="w-full"
                    isLoading={isSubmitting}
                    startContent={
                      isSubmitting ? null : (
                        <MaterialSymbol
                          name={mode === "login" ? "login" : "person_add"}
                          className="text-[18px]"
                        />
                      )
                    }
                  >
                    {mode === "login" ? "Entrar" : "Cadastrar"}
                  </Button>
                </form>

                <div className="text-center text-sm text-foreground/80">
                  {mode === "login" ? "Ainda não tem conta?" : "Já possui conta?"}{" "}
                  <button
                    type="button"
                    className="font-semibold text-primary hover:underline"
                    onClick={() => {
                      setMode((current) => (current === "login" ? "register" : "login"));
                      setError(null);
                    }}
                  >
                    {mode === "login" ? "Criar cadastro" : "Fazer login"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </main>
  );
}
