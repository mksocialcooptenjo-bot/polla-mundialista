// netlify/functions/obtener-partidos.js

export const handler = async (event, context) => {
  // Obtener la fecha que pasamos desde el frontend (?date=YYYY-MM-DD)
  const date = event.queryStringParameters.date;
  const token = process.env.FOOTBALL_DATA_TOKEN;

  if (!date) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "Falta el parámetro de fecha." }),
    };
  }

  try {
    const url = `https://api.football-data.org/v4/competitions/WC/matches?dateFrom=${date}&dateTo=${date}`;
    
    const respuesta = await fetch(url, {
      method: "GET",
      headers: { "X-Auth-Token": token }
    });

    if (!respuesta.ok) {
      return {
        statusCode: respuesta.status,
        body: JSON.stringify({ error: "Error al consultar la API de fútbol" }),
      };
    }

    const datos = await respuesta.json();

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        // Permitimos CORS por seguridad en desarrollo, Netlify lo maneja en producción
        "Access-Control-Allow-Origin": "*", 
      },
      body: JSON.stringify(datos),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};