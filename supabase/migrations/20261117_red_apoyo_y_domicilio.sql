-- Migración aditiva. No borra columnas, no modifica registros existentes
-- y no cambia políticas RLS, permisos ni roles.
-- Ejecutar en el editor SQL de Supabase antes de probar el formulario.
-- No sustituye a 20261117_solicitud_datos_complementarios.sql.

alter table public.solicitudes
  add column if not exists estado_domicilio text,
  add column if not exists localidad text,
  add column if not exists papa_contacto_emergencia boolean,
  add column if not exists mama_contacto_emergencia boolean,
  add column if not exists tutor_contacto_emergencia boolean,
  add column if not exists contactos_adicionales jsonb;

comment on column public.solicitudes.estado_domicilio is
  'Estado de la República del domicilio. No usar solicitudes.estado: ese campo es el estatus del trámite.';

comment on column public.solicitudes.localidad is
  'Ciudad o localidad asociada al código postal, cuando el catálogo la proporciona.';

comment on column public.solicitudes.contactos_adicionales is
  'Personas adicionales de la red de apoyo. Cada elemento: nombre, parentesco, telefono, emergencia.';
