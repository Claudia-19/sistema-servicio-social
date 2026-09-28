import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";

async function ErrorContent({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  const params = await searchParams;

  return (
    <>
      {params?.error ? (
        <p className="text-sm leading-6 text-[#707272]">
          Código del error: {params.error}
        </p>
      ) : (
        <p className="text-sm leading-6 text-[#707272]">
          Ocurrió un error inesperado.
        </p>
      )}
    </>
  );
}

export default function Page({
  searchParams,
}: {
  searchParams: Promise<{ error: string }>;
}) {
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Encabezado institucional */}
      <header className="border-b border-[#621132] bg-[#621132]">
        <div className="mx-auto flex max-w-7xl items-center justify-center px-6 py-5">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-24 w-auto object-contain"
          />
        </div>
      </header>

      {/* Contenido */}
      <section className="flex min-h-[calc(100vh-130px)] w-full items-center justify-center px-6 py-14">
        <div className="w-full max-w-xl">
          <div className="flex flex-col gap-6">
            <Card className="border border-[#D4C29C] shadow-sm">
              <CardHeader>
                <CardTitle className="text-2xl text-[#621132]">
                  Ocurrió un problema
                </CardTitle>
              </CardHeader>

              <CardContent>
                <Suspense>
                  <ErrorContent searchParams={searchParams} />
                </Suspense>

                <div className="mt-6 text-center">
                  <Link
                    href="/login"
                    className="inline-flex rounded-lg bg-[#621132] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#9D2449]"
                  >
                    Regresar a iniciar sesión
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </main>
  );
}