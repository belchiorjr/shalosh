"use client";

import { Button } from "@heroui/button";
import { Card, CardBody, CardHeader } from "@heroui/card";
import { Input } from "@heroui/input";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

import { createPasswordRecoveryControllerDependencies } from "@/modules/password-recovery/composition/create-password-recovery-controller-deps";
import { usePasswordRecoveryController } from "@/modules/password-recovery/presentation/use-password-recovery-controller";

export default function ForgotPasswordPage() {
  const controllerDependencies = useMemo(
    () => createPasswordRecoveryControllerDependencies(),
    [],
  );
  const { isLoading, error, successMessage, requestReset } =
    usePasswordRecoveryController(controllerDependencies);
  const [login, setLogin] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await requestReset(login);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6 py-10">
      <Card className="w-full max-w-sm bg-content1/95" shadow="none">
        <CardHeader className="flex flex-col items-start gap-1">
          <h1 className="text-xl font-semibold text-foreground">
            Recuperar senha
          </h1>
          <p className="text-sm text-foreground/70">
            Enviaremos um link de redefinição para o e-mail cadastrado.
          </p>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Login ou e-mail"
              placeholder="admin"
              value={login}
              onValueChange={setLogin}
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
              Enviar link
            </Button>

            <Link
              href="/login"
              className="block text-center text-sm text-foreground/70 hover:text-foreground"
            >
              Voltar para o login
            </Link>
          </form>
        </CardBody>
      </Card>
    </main>
  );
}
