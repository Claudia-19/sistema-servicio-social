"use client";

import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { useState } from "react";

export function ForgotPasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) {
        throw error;
      }

      setSuccess(true);
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al solicitar el cambio de contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {success ? (
        <Card className="border border-[#D4C29C] shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#621132]">
              Revisa tu correo electrónico
            </CardTitle>

            <CardDescription className="text-[#707272]">
              Se ha enviado la información para restablecer tu contraseña.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <p className="text-sm leading-6 text-[#707272]">
              Si el correo electrónico está registrado, recibirás un mensaje
              con las instrucciones para establecer una nueva contraseña.
            </p>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#9D2449] underline-offset-4 hover:text-[#621132] hover:underline"
              >
                Regresar a iniciar sesión
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border border-[#D4C29C] shadow-sm">
          <CardHeader>
            <CardTitle className="text-2xl text-[#621132]">
              Recuperar contraseña
            </CardTitle>

            <CardDescription className="text-[#707272]">
              Ingresa tu correo electrónico para recibir un enlace y
              restablecer tu contraseña.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleForgotPassword}>
              <div className="flex flex-col gap-6">

                <div className="grid gap-2">
                  <Label
                    htmlFor="email"
                    className="text-[#621132]"
                  >
                    Correo electrónico
                  </Label>

                  <Input
                    id="email"
                    type="email"
                    placeholder="correo@ejemplo.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="focus:border-[#9D2449] focus:ring-[#D4C29C]"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-500">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  className="w-full bg-[#621132] text-white hover:bg-[#9D2449]"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Enviando..."
                    : "Enviar enlace de recuperación"}
                </Button>
              </div>

              <div className="mt-6 text-center text-sm text-[#707272]">
                ¿Ya tienes una cuenta?{" "}

                <Link
                  href="/login"
                  className="font-semibold text-[#9D2449] underline-offset-4 hover:text-[#621132] hover:underline"
                >
                  Iniciar sesión
                </Link>
              </div>
            </form>
          </CardContent>
        </Card>
      )}
    </div>
  );
}