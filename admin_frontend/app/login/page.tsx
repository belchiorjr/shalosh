"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo } from "react";

import { LogInIcon } from "@/components/icons";
import { createLoginControllerDependencies } from "@/modules/auth/composition/create-login-controller-deps";
import { useLoginController } from "@/modules/auth/presentation/use-login-controller";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const controllerDependencies = useMemo(
    () => createLoginControllerDependencies(),
    [],
  );
  const {
    login,
    password,
    isLoading,
    error,
    setLogin,
    setPassword,
    submit,
  } = useLoginController(controllerDependencies);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isAuthenticated = await submit();
    if (isAuthenticated) {
      const nextPath = searchParams.get("from") || "/";
      router.replace(nextPath);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col items-center gap-10 lg:flex-row lg:items-center lg:justify-center lg:gap-16">
        <div className="flex w-full flex-col items-center justify-center gap-6 text-center lg:w-1/2 lg:items-start lg:text-left">
          <img
            src="/shalosh_marca_x.svg"
            alt="Shalosh"
            className="h-16 w-auto dark:hidden"
          />
          <img
            src="/shalosh_marca_x_dark.svg"
            alt="Shalosh"
            className="hidden h-16 w-auto dark:block"
          />
          <div className="space-y-3">
            <h1 className="text-3xl font-semibold text-foreground">
              Bem-vindo ao painel Shalosh
            </h1>
            <p className="text-base text-foreground/70">
              Faça login para acessar as ferramentas administrativas.
            </p>
          </div>
        </div>

        <Card className="w-full max-w-sm bg-content1/95 backdrop-blur-sm lg:w-1/2" shadow="sm">
          <CardHeader className="flex flex-col items-start gap-1">
            <h2 className="text-xl font-semibold text-foreground">Login</h2>
            <p className="text-sm text-foreground/70">
              Acesse o painel administrativo.
            </p>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Login"
                placeholder="admin"
                type="text"
                value={login}
                onValueChange={setLogin}
                isRequired
              />
              <Input
                label="Senha"
                placeholder="Sua senha"
                type="password"
                value={password}
                onValueChange={setPassword}
                isRequired
              />

              {error ? <p className="text-sm text-danger">{error}</p> : null}

              <Button
                color="primary"
                type="submit"
                className="w-full"
                startContent={<LogInIcon />}
                isLoading={isLoading}
              >
                Entrar
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </main>
  );
}
