"use client";

import type { ReactNode } from "react";

type AnchoContenido = "panel" | "formulario";

type HeaderSesion = {
  variante?: "sesion";
  nombreUsuario: string;
  rol: string;
  logoutButton: ReactNode;
  ancho?: AnchoContenido;
};

type HeaderIdentidad = {
  variante: "identidad";
  nombreUsuario: string;
  rol: string;
  ancho?: AnchoContenido;
};

type HeaderLogo = {
  variante: "logo";
  ancho?: AnchoContenido;
};

type HeaderCentro = {
  variante: "centro";
};

type HeaderInstitucionalProps =
  | HeaderSesion
  | HeaderIdentidad
  | HeaderLogo
  | HeaderCentro;

const clasesAncho: Record<AnchoContenido, string> = {
  panel: "max-w-7xl",
  formulario: "max-w-5xl",
};

function claseContenedor(ancho: AnchoContenido, centrado: boolean) {
  return `mx-auto flex h-14 w-full items-center gap-3 px-4 sm:px-6 ${clasesAncho[ancho]} ${
    centrado ? "justify-center" : "justify-between"
  }`;
}

function Logotipo() {
  return (
    <img
      src="/logo-pachuca.png"
      alt="Pachuca Capital de la Transformación"
      className="h-9 w-auto shrink-0 object-contain object-center sm:h-10"
    />
  );
}

function DatosUsuario({
  nombreUsuario,
  rol,
  logoutButton,
}: {
  nombreUsuario: string;
  rol: string;
  logoutButton?: ReactNode;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <div className="min-w-0 max-w-[42vw] text-right sm:max-w-sm">
        <p className="truncate text-sm font-semibold leading-tight text-white">
          {nombreUsuario}
        </p>

        <p className="truncate text-xs leading-tight text-white/80">
          {rol}
        </p>
      </div>

      {logoutButton}
    </div>
  );
}

export default function HeaderInstitucional(props: HeaderInstitucionalProps) {
  const encabezado =
    "sticky top-0 z-40 border-b border-[#621132] bg-[#621132] shadow-[inset_0_-2px_0_#B38E5D]";

  if (props.variante === "centro") {
    return (
      <header className={encabezado}>
        <div className={claseContenedor("panel", true)}>
          <Logotipo />
        </div>
      </header>
    );
  }

  if (props.variante === "logo") {
    return (
      <header className={encabezado}>
        <div className={claseContenedor(props.ancho ?? "formulario", true)}>
          <Logotipo />
        </div>
      </header>
    );
  }

  if (props.variante === "identidad") {
    return (
      <header className={encabezado}>
        <div className={claseContenedor(props.ancho ?? "panel", false)}>
          <Logotipo />
          <DatosUsuario
            nombreUsuario={props.nombreUsuario}
            rol={props.rol}
          />
        </div>
      </header>
    );
  }

  return (
    <header className={encabezado}>
      <div className={claseContenedor(props.ancho ?? "panel", false)}>
        <Logotipo />
        <DatosUsuario
          nombreUsuario={props.nombreUsuario}
          rol={props.rol}
          logoutButton={props.logoutButton}
        />
      </div>
    </header>
  );
}
