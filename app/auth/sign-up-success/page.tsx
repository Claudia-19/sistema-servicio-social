import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import HeaderInstitucional from "@/components/HeaderInstitucional";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
      <HeaderInstitucional variante="centro" />

      {/* MENSAJE */}
      <section className="flex w-full items-start justify-center px-4 py-8 sm:px-6">
        <div className="w-full max-w-md">
          <div className="flex flex-col gap-6">
            <Card className="border-dorado-claro shadow-sm">
              <CardHeader>
                <div className="mb-2 h-1 w-12 rounded-full bg-vino-oscuro" />

                <CardTitle className="text-2xl text-vino-oscuro">
                  ¡Gracias por registrarte!
                </CardTitle>

                <CardDescription className="text-gris-oscuro">
                  Revisa tu correo electrónico para confirmar tu cuenta
                </CardDescription>
              </CardHeader>

              <CardContent>
                <p className="text-sm leading-6 text-gris-oscuro">
                  Te has registrado correctamente. Revisa tu correo electrónico
                  para confirmar tu cuenta antes de iniciar sesión.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}