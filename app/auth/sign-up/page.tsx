import { SignUpForm } from "@/components/sign-up-form";

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

      {/* REGISTRO */}
      <section className="flex min-h-[calc(100vh-89px)] w-full items-center justify-center px-6 py-12">
        <div className="w-full max-w-sm">
          <SignUpForm />
        </div>
      </section>
    </main>
  );
}