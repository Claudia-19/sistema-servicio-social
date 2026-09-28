"use client";

type HeaderInstitucionalProps = {
  nombreUsuario: string;
  rol: string;
  logoutButton: React.ReactNode;
};

export default function HeaderInstitucional({
  nombreUsuario,
  rol,
  logoutButton,
}: HeaderInstitucionalProps) {
  return (
    <header className="border-b border-[#621132] bg-[#621132]">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
        {/* Logo institucional */}
        <div className="flex items-center">
          <img
            src="/logo-pachuca.png"
            alt="Pachuca Capital de la Transformación"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Usuario */}
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-medium text-white">
              {nombreUsuario}
            </p>

            <p className="text-xs text-white/80">
              {rol}
            </p>
          </div>

          {logoutButton}
        </div>
      </div>
    </header>
  );
}