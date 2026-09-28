import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Page() {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* ENCABEZADO INSTITUCIONAL */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto max-w-7xl px-6 py-3">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-16 w-auto object-contain"
          />
        </div>
      </header>

      {/* MENSAJE */}
      <section className="flex min-h-[calc(100vh-89px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
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