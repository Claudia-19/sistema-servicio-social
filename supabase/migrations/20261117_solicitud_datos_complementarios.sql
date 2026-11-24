-- Migración aditiva para la solicitud del estudiante.
-- Agrega columnas nuevas y no modifica, borra ni sobrescribe registros existentes.
-- No cambia políticas RLS ni permisos.
-- Ejecutar en el editor SQL de Supabase antes de probar el formulario actualizado.

alter table public.solicitudes
  add column if not exists nombres text,
  add column if not exists apellido_paterno text,
  add column if not exists apellido_materno text,
  add column if not exists codigo_postal text,
  -- solicitudes.estado ya existe y guarda el estatus del trámite.
  -- El estado geográfico del domicilio va en estado_domicilio.
  add column if not exists estado_domicilio text,
  add column if not exists municipio text,
  add column if not exists colonia text,
  add column if not exists calle text,
  add column if not exists numero_exterior text,
  add column if not exists numero_interior text,
  add column if not exists institucion_pendiente_revision boolean not null default false,
  add column if not exists carrera_id bigint references public.carreras (id),
  add column if not exists tiene_seguro_facultativo boolean,
  add column if not exists seguro_facultativo_institucion text,
  add column if not exists seguro_facultativo_otro text;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'solicitudes_seguro_facultativo_institucion_check'
  ) then
    alter table public.solicitudes
      add constraint solicitudes_seguro_facultativo_institucion_check
      check (
        seguro_facultativo_institucion is null
        or seguro_facultativo_institucion in ('IMSS', 'ISSSTE', 'Otro')
      );
  end if;
end $$;
