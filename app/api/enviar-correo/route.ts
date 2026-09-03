import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { correo, nombre, area } = await request.json();

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
          Por favor, preséntate en Recursos Humanos con tu
          <strong>carta de presentación</strong> para continuar
          con el proceso.
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

    return Response.json({ success: true, data });
  } catch (error) {
    console.error(error);

    return Response.json(
      { error: "Error al enviar el correo" },
      { status: 500 }
    );
  }
}