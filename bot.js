require("dotenv").config();
const TelegramBot = require("node-telegram-bot-api");
const fetch = require("node-fetch");
const { guardarPedido } = require("./db");

const bot = new TelegramBot("TELEGRAM_TOKEN", { polling: true });
const API_KEY = "API";

const INSTAGRAM_URL = "https://www.instagram.com/worldfitnesscln";

const PALABRAS_CATALOGO = ["catalogo", "catálogo", "fotos", "ver ropa", "qué tienen", "que tienen", "modelos", "ver productos"];

const SYSTEM_PROMPT = `Eres un cuate que atiende en World Fitness Culiacán. Vendes ropa YoungLA y Gymshark con entregas en Culiacán.

Reglas importantes:
- Respuestas de máximo 2 líneas, directas y al punto
- No repitas preguntas que ya hiciste
- No preguntes lo mismo dos veces
- Si el cliente ya dijo la marca, no la vuelvas a preguntar
- Habla natural, buena onda, sin ser robot
- Usa emojis con moderación
-No repetir que onda en todo las lineas de conversacion

Si el cliente quiere comprar, pide estos datos uno por uno de forma natural: nombre, producto, talla, teléfono y dirección.
Cuando tengas todos los datos escribe: PEDIDO_LISTO|nombre|producto|talla|telefono|direccion`;

function pideCatalogo(texto) {
  const lower = texto.toLowerCase();
  return PALABRAS_CATALOGO.some(p => lower.includes(p));
}

async function preguntarGemini(mensaje) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${API_KEY}`;

  const payload = {
    contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nCliente: ${mensaje}` }] }]
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (data.error) {
      console.error("❌ Error Google:", data.error.message);
      return "Dame un momento, algo falló. Intenta de nuevo.";
    }

    return data.candidates[0].content.parts[0].text;
  } catch (e) {
    return "Algo falló, intenta en un momento.";
  }
}

bot.on("message", async (msg) => {
  const chatId = msg.chat.id;
  if (!msg.text || msg.text.startsWith("/")) return;

  if (pideCatalogo(msg.text)) {
    await bot.sendMessage(chatId, `Aquí está nuestro Instagram con todo el catálogo 👇\n${INSTAGRAM_URL}\n\n¿Ves algo que te guste?`);
    return;
  }

  await bot.sendChatAction(chatId, "typing");
  const respuesta = await preguntarGemini(msg.text);

  if (respuesta.includes("PEDIDO_LISTO|")) {
    const p = respuesta.split("PEDIDO_LISTO|")[1].split("|");
    guardarPedido({ nombre: p[0], producto: p[1], talla: p[2], telefono: p[3] });
  }

  const textoFinal = respuesta.replace(/PEDIDO_LISTO\|[^\n]*/g, "").trim();
  await bot.sendMessage(chatId, textoFinal);
});

bot.onText(/\/start/, (msg) => {
  bot.sendMessage(msg.chat.id, "¡Ey, qué onda! 👋 Bienvenido a World Fitness Culiacán. ¿Qué andas buscando?");
});

console.log("🚀 Bot activo.");
