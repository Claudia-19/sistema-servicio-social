import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Suspense } from "react";
import Link from "next/link";
import HeaderInstitucional from "@/components/HeaderInstitucional";

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
      <HeaderInstitucional variante="centro" />

      {/* Contenido */}
      <section className="flex w-full items-start justify-center px-4 py-8 sm:px-6">
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