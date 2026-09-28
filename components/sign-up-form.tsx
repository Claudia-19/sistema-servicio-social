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
import { useRouter } from "next/navigation";
import { useState } from "react";

export function SignUpForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    if (password !== repeatPassword) {
      setError("Las contraseñas no coinciden");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        throw error;
      }

      if (data.session) {
        router.push("/alumno");
        router.refresh();
      } else {
        setError(
          "La cuenta fue creada, pero debes confirmar tu correo electrónico antes de continuar."
        );
      }
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al crear la cuenta"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border-dorado-claro shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-vino-oscuro">
            Crear cuenta
          </CardTitle>

          <CardDescription className="text-gris-oscuro">
            Crea una nueva cuenta
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSignUp}>
            <div className="flex flex-col gap-6">
              <div className="grid gap-2">
                <Label
                  htmlFor="email"
                  className="text-vino-oscuro"
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
                  className="focus:border-vino-claro focus:ring-[#D4C29C]"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-vino-oscuro"
                >
                  Contraseña
                </Label>

                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="focus:border-vino-claro focus:ring-[#D4C29C]"
                />
              </div>

              <div className="grid gap-2">
                <Label
                  htmlFor="repeat-password"
                  className="text-vino-oscuro"
                >
                  Confirmar contraseña
                </Label>

                <Input
                  id="repeat-password"
                  type="password"
                  required
                  value={repeatPassword}
                  onChange={(e) => setRepeatPassword(e.target.value)}
                  className="focus:border-vino-claro focus:ring-[#D4C29C]"
                />
              </div>

              {error && (
                <p className="text-sm text-red-500">
                  {error}
                </p>
              )}

              <Button
                type="submit"
                className="w-full bg-vino-oscuro text-white hover:bg-vino-claro"
                disabled={isLoading}
              >
                {isLoading
                  ? "Creando cuenta..."
                  : "Crear cuenta"}
              </Button>
            </div>

            <div className="mt-4 text-center text-sm text-gris-oscuro">
              ¿Ya tienes una cuenta?{" "}

              <Link
                href="/auth/login"
                className="font-medium text-vino-claro underline underline-offset-4 hover:text-vino-oscuro"
              >
                Iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}