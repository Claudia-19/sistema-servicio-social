import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

const CORREO_ADMINISTRADORA = "claudiagalvanflores@gmail.com";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { tipo } = body;

    // =========================================================
    // CORREO DE NOTIFICACIÓN A ADMINISTRADORA
    // =========================================================

    if (tipo === "propuesta") {
      const {
        nombreAlumno,
        carrera,
        tipoProceso,
        area,
      } = body;

      const { data, error } = await resend.emails.send({
        from: "onboarding@resend.dev",
        to: CORREO_ADMINISTRADORA,
        subject: "Nueva propuesta de asignación pendiente",
        html: `
          <h2>Nueva propuesta de asignación</h2>

          <p>
            Se ha generado una nueva propuesta de asignación
            para revisión y autorización.
          </p>

          <p>
            <strong>Estudiante:</strong> ${nombreAlumno || "No especificado"}
          </p>

          <p>
            <strong>Carrera:</strong> ${carrera || "No especificada"}
          </p>

          <p>
            <strong>Tipo de presentación:</strong>
            ${tipoProceso || "No especificado"}
          </p>

          <p>
            <strong>Área propuesta:</strong>
            ${area || "No especificada"}
          </p>

          <p>
            Ingresa al sistema para consultar la propuesta
            y realizar la autorización correspondiente.
          </p>

          <p>
            Atentamente,<br />
            Sistema de Control de Prestadores<br />
            Recursos Humanos<br />
            Presidencia Municipal de Pachuca de Soto, Hidalgo
          </p>
        `,
      });

      if (error) {
        console.error(error);

        return Response.json(
          { error: error.message },
          { status: 500 }
        );
      }

      return Response.json({
        success: true,
        data,
      });
    }

    // =========================================================
    // CORREO DE ASIGNACIÓN AL ALUMNO
    // =========================================================

    const { correo, nombre, area } = body;

    if (!correo) {
      return Response.json(
        { error: "No se proporcionó un correo electrónico" },
        { status: 400 }
      );
    }

    const { data, error } = await resend.emails.send({
      from: "onboarding@resend.dev",
      to: correo,
      subject: "Asignación de Servicio Social / Prácticas Profesionales",
      html: `
        <h2>Asignación de Servicio Social / Prácticas Profesionales</h2>

        <p>Hola <strong>${nombre}</strong>:</p>

        <p>
          Te informamos que tu solicitud ha sido autorizada
          y se te ha asignado un área para realizar tu
          servicio social o prácticas profesionales.
        </p>

        <p>
          <strong>Área asignada:</strong> ${area}
        </p>

        <p>
          Por favor, preséntate en el
          <strong>Departamento de Capacitación</strong>
          con tu <strong>carta de presentación</strong>
          para continuar con el proceso.
        </p>

        <p>
          <strong>Ubicación:</strong><br />
          Excolegio Francisco de Siles, No. 29<br />
          A un costado de la Presidencia Municipal.
        </p>

        <p>
          <a
            href="https://maps.app.goo.gl/vfHVmxugFfJQ1zDt9"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display: inline-block;
              padding: 10px 16px;
              background-color: #621132;
              color: #ffffff;
              text-decoration: none;
              border-radius: 6px;
            "
          >
            Ver ubicación en Google Maps
          </a>
        </p>

        <p>
          Atentamente,<br />
          Recursos Humanos<br />
          Presidencia Municipal de Pachuca de Soto, Hidalgo
        </p>
      `,
    });

    if (error) {
      console.error(error);

      return Response.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return Response.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al enviar el correo" },
      { status: 500 }
    );
  }
}