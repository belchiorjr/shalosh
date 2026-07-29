"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, Suspense, useMemo, useState } from "react";

import { createPasswordRecoveryControllerDependencies } from "@/modules/password-recovery/composition/create-password-recovery-controller-deps";
import { usePasswordRecoveryController } from "@/modules/password-recovery/presentation/use-password-recovery-controller";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<main className="min-h-screen bg-background" />}>
      <ResetPasswordPageContent />
    </Suspense>
  );
}

function ResetPasswordPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const controllerDependencies = useMemo(
    () => createPasswordRecoveryControllerDependencies(),
    [],
  );
  const { isLoading, error, successMessage, confirmReset } =
    usePasswordRecoveryController(controllerDependencies);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const isUpdated = await confirmReset(
      token,
      password,
      passwordConfirmation,
    );

    if (isUpdated) {
      setPassword("");
      setPasswordConfirmation("");
      setTimeout(() => router.replace("/login"), 2000);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm bg-content1/95" shadow="none">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Definir nova senha
          </h1>
          <p className="text-sm text-foreground/70">
            Escolha uma senha com no mínimo 6 caracteres.
          </p>
        </CardHeader>
        <CardBody>
          {token ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Nova senha"
                type="password"
                value={password}
                onValueChange={setPassword}
                isRequired
              />
              <Input
                label="Confirmar nova senha"
                type="password"
                value={passwordConfirmation}
                onValueChange={setPasswordConfirmation}
                isRequired
              />

              {error ? <p className="text-sm text-danger">{error}</p> : null}
              {successMessage ? (
                <p className="text-sm text-success">{successMessage}</p>
              ) : null}

              <Button
                color="primary"
                type="submit"
                className="w-full"
                isLoading={isLoading}
              >
                Redefinir senha
              </Button>
            </form>
          ) : (
            <p className="text-sm text-danger">
              Link de recuperação inválido ou incompleto. Solicite um novo.
            </p>
          )}

          <Link
            href="/login"
            className="mt-4 block text-center text-sm text-foreground/70 hover:text-foreground"
          >
            Voltar para o login
          </Link>
        </CardBody>
      </Card>
    </main>
  );
}
