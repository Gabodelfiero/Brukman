// api/crear-preferencia.js
// Genera un link de pago (preferencia) vía API de Mercado Pago.
// A diferencia del link manual, este SÍ queda conectado a los
// webhooks de la aplicación, porque se crea con el Access Token de la app.

module.exports = async function handler(req, res) {
  // Permitir que el navegador llame a esta función (CORS básico)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const preferenceBody = {
      items: [
        {
          title: 'Producto de prueba',
          quantity: 1,
          unit_price: 100,
          currency_id: 'ARS',
        },
      ],
      // Acá es donde se conecta el pago con el webhook de la app
      notification_url: 'https://alebrukman.com.ar/api/webhook-mp',
      back_urls: {
        success: 'https://alebrukman.com.ar/gracias.html',
        failure: 'https://alebrukman.com.ar/producto.html',
        pending: 'https://alebrukman.com.ar/producto.html',
      },
      auto_return: 'approved',
    };

    const mpResponse = await fetch(
      'https://api.mercadopago.com/checkout/preferences',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${process.env.MP_ACCESS_TOKEN}`,
          'Content-Type': 'application/json',
        },
