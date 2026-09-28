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

export function UpdatePasswordForm({
  className,
  ...props
}: React.ComponentPropsWithoutRef<"div">) {
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();

    const supabase = createClient();

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password,
      });

      if (error) {
        throw error;
      }

      router.push("/login");
    } catch (error: unknown) {
      setError(
        error instanceof Error
          ? error.message
          : "Ocurrió un error al actualizar la contraseña"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      <Card className="border border-[#D4C29C] shadow-sm">
        <CardHeader>
          <CardTitle className="text-2xl text-[#621132]">
            Actualizar contraseña
          </CardTitle>

          <CardDescription className="text-[#707272]">
            Ingresa una nueva contraseña para tu cuenta.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleUpdatePassword}>
            <div className="flex flex-col gap-6">

              <div className="grid gap-2">
                <Label
                  htmlFor="password"
                  className="text-[#621132]"
                >
                  Nueva contraseña
                </Label>

                <Input
                  id="password"
                  type="password"
                  placeholder="Nueva contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                  ? "Guardando..."
                  : "Guardar nueva contraseña"}
              </Button>
            </div>

            <div className="mt-6 text-center">
              <Link
                href="/login"
                className="text-sm font-semibold text-[#9D2449] underline-offset-4 hover:text-[#621132] hover:underline"
              >
                Regresar a iniciar sesión
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}