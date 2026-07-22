bash

cat /home/claude/test-mp/api/webhook-mp.js
Salida

// api/webhook-mp.js
// Esta función recibe la notificación de Mercado Pago, confirma el pago
// contra la API, y manda el mail con el link del producto vía Resend.

export default async function handler(req, res) {
  // Mercado Pago solo manda POST
  if (req.method !== 'POST') {
    return res.status(200).send('ok'); // responder 200 igual, MP a veces prueba con GET
  }

  try {
    const { type, data } = req.body;

    // Solo nos interesan las notificaciones de tipo "payment"
    if (type !== 'payment') {
      return res.status(200).send('ignorado');
    }

    const paymentId = data.id;

    // 1. Consultamos el pago real en la API de Mercado Pago
    const mpResponse = await fetch(
      `https://api.mercadopago.com/v1/payments/${paymentId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
        },
      }
    );

    const payment = await mpResponse.json();

    // 2. Verificamos que esté aprobado
    if (payment.status !== 'approved') {
      return res.status(200).send('no aprobado todavia');
    }

    // 3. Sacamos el email del comprador
    const buyerEmail = payment.payer?.email;

    if (!buyerEmail) {
      console.error('No se encontró email del comprador', payment);
      return res.status(200).send('sin email');
    }

    // 4. Mandamos el mail con Resend
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev', // luego se cambia por un dominio propio verificado
        to: buyerEmail,
        subject: '¡Gracias por tu compra! Acá está tu contenido',
        html: `
          <div style="font-family: sans-serif; max-width: 500px; margin: auto;">
            <h2>¡Gracias por tu compra!</h2>
            <p>Ya podés acceder a tu contenido en el siguiente link:</p>
            <p>
              <a href="${process.env.PRODUCT_URL}"
                 style="background:#3483fa;color:#fff;padding:12px 24px;
                        text-decoration:none;border-radius:8px;display:inline-block;">
                Acceder al contenido
              </a>
            </p>
            <p style="color:#888;font-size:12px;">
              Si el botón no funciona, copiá y pegá este link en tu navegador:<br/>
              ${process.env.PRODUCT_URL}
            </p>
          </div>
        `,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Error enviando mail con Resend:', errorText);
      return res.status(200).send('error enviando mail');
    }

    return res.status(200).send('procesado ok');
  } catch (error) {
    console.error('Error en webhook:', error);
    return res.status(200).send('error interno'); // 200 igual para que MP no reintente en loop
  }
}
Listo
