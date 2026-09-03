"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function SolicitudPage() {
  const router = useRouter();
  const supabase = createClient();

  const [formulario, setFormulario] = useState({
    nombre: "",
    domicilio: "",
    institucion: "",
    carrera: "",
    semestre: "",
    matricula: "",
    telefono: "",
    correo: "",
    tipoProceso: "",
    fechaInicio: "",
    horario: "",
    informacionAdicional: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [solicitudExistente, setSolicitudExistente] = useState(false);
  const [cargandoSolicitud, setCargandoSolicitud] = useState(true);

  useEffect(() => {
  const obtenerSolicitud = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setCargandoSolicitud(false);
      return;
    }

    const { data: solicitud } = await supabase
      .from("solicitudes")
      .select("*")
      .eq("usuario_id", user.id)
      .order("fecha_solicitud", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (solicitud) {
      setSolicitudExistente(true);

      setFormulario({
        nombre: solicitud.nombre ?? "",
        domicilio: solicitud.domicilio ?? "",
        institucion: solicitud.institucion_educativa ?? "",
        carrera: solicitud.carrera ?? "",
        semestre: solicitud.semestre_cuatrimestre ?? "",
        matricula: solicitud.matricula ?? "",
        telefono: solicitud.telefono ?? "",
        correo: solicitud.correo ?? "",
        tipoProceso: solicitud.tipo_proceso ?? "",
        fechaInicio: solicitud.fecha_inicio ?? "",
        horario: solicitud.horario_propuesto ?? "",
        informacionAdicional: solicitud.informacion_adicional ?? "",
      });
    }

    setCargandoSolicitud(false);
  };

  obtenerSolicitud();
}, [supabase]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormulario({
      ...formulario,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    setLoading(true);
    setError("");

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      setError("Tu sesión ha expirado. Inicia sesión nuevamente.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("solicitudes")
      .insert({
        usuario_id: user.id,
        nombre: formulario.nombre,
        domicilio: formulario.domicilio,
        institucion_educativa: formulario.institucion,
        carrera: formulario.carrera,
        semestre_cuatrimestre: formulario.semestre,
        matricula: formulario.matricula,
        telefono: formulario.telefono,
        correo: formulario.correo,
        tipo_proceso: formulario.tipoProceso,
        fecha_inicio: formulario.fechaInicio,
        horario_propuesto: formulario.horario,
        informacion_adicional: formulario.informacionAdicional,
      });

    if (insertError) {
      console.error(insertError);
      setError("No fue posible enviar la solicitud. Inténtalo nuevamente.");
      setLoading(false);
      return;
    }

    router.push("/alumno");
    router.refresh();
  };
if (cargandoSolicitud) {
  return (
    <main className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-5xl px-6 py-10">
        <p className="text-sm text-gray-600">
          Cargando tu solicitud...
        </p>
      </div>
    </main>
  );
}
  return (
    <main className="min-h-screen bg-gray-50">
      <header className="border-b bg-white">
        <div className="mx-auto max-w-5xl px-6 py-5">
          <h1 className="text-xl font-bold text-gray-900">
            Sistema de Control de Servicio Social
          </h1>

          <p className="text-sm text-gray-500">
            Solicitud de servicio social
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="mb-8">
          <p className="text-sm font-semibold uppercase tracking-wider text-gray-500">
            Alumno / Prestador
          </p>

          <h2 className="mt-2 text-3xl font-bold text-gray-900">
            Solicitud
          </h2>

          <p className="mt-2 text-gray-600">
            Completa la información solicitada para iniciar tu proceso.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm"
        >
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Datos del alumno
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              Proporciona tus datos personales y académicos.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <div>
              <label
                htmlFor="nombre"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Nombre completo
              </label>

              <input
                id="nombre"
                name="nombre"
                type="text"
                value={formulario.nombre}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="domicilio"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Domicilio
              </label>

              <input
                id="domicilio"
                name="domicilio"
                type="text"
                value={formulario.domicilio}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="institucion"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Institución educativa
              </label>

              <input
                id="institucion"
                name="institucion"
                type="text"
                value={formulario.institucion}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="carrera"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Carrera
              </label>

              <input
                id="carrera"
                name="carrera"
                type="text"
                value={formulario.carrera}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="semestre"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Semestre / Cuatrimestre
              </label>

              <input
                id="semestre"
                name="semestre"
                type="text"
                value={formulario.semestre}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. 9° cuatrimestre"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="matricula"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Matrícula / Número de control
              </label>

              <input
                id="matricula"
                name="matricula"
                type="text"
                value={formulario.matricula}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="telefono"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Teléfono celular
              </label>

              <input
                id="telefono"
                name="telefono"
                type="tel"
                value={formulario.telefono}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="correo"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Correo electrónico
              </label>

              <input
                id="correo"
                name="correo"
                type="email"
                value={formulario.correo}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="tipoProceso"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Tipo de proceso
              </label>

              <select
                id="tipoProceso"
                name="tipoProceso"
                value={formulario.tipoProceso}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 outline-none focus:border-gray-500"
              >
                <option value="">Selecciona una opción</option>
                <option value="Servicio social">Servicio social</option>
                <option value="Prácticas profesionales">
                  Prácticas profesionales
                </option>
                <option value="Estadía">Estadía</option>
                <option value="Otro">Otro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="fechaInicio"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Fecha de inicio
              </label>

              <input
                id="fechaInicio"
                name="fechaInicio"
                type="date"
                value={formulario.fechaInicio}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>

            <div>
              <label
                htmlFor="horario"
                className="mb-2 block text-sm font-medium text-gray-700"
              >
                Horario propuesto
              </label>

              <input
                id="horario"
                name="horario"
                type="text"
                value={formulario.horario}
                onChange={handleChange}
                required
                disabled={solicitudExistente}
                placeholder="Ej. 9:00 a 15:00"
                className="w-full rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="informacionAdicional"
              className="mb-2 block text-sm font-medium text-gray-700"
            >
              Información adicional
            </label>

            <textarea
              id="informacionAdicional"
              name="informacionAdicional"
              value={formulario.informacionAdicional}
              onChange={handleChange}
              rows={5}
              placeholder="Escribe información adicional que consideres importante."
              className="w-full resize-none rounded-lg border border-gray-300 px-4 py-3 outline-none focus:border-gray-500"
            />
          </div>

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
            <a
              href="/alumno"
              className="text-sm text-gray-500 hover:text-gray-900"
            >
              ← Regresar al panel
            </a>

            {!solicitudExistente && (
  <button
    type="submit"
    disabled={loading}
    className="rounded-lg bg-gray-900 px-6 py-3 font-medium text-white transition hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-60"
  >
    {loading ? "Enviando..." : "Enviar solicitud"}
  </button>
)}
          </div>
        </form>
      </section>
    </main>
  );
}