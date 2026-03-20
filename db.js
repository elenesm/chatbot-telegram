const fs = require("fs");
const path = require("path");
const DB_FILE = path.join(__dirname, "pedidos.json");
if (!fs.existsSync(DB_FILE)) {
  fs.writeFileSync(DB_FILE, JSON.stringify({ pedidos: [] }, null, 2));
}
function leerDB() {
  return JSON.parse(fs.readFileSync(DB_FILE, "utf8"));
}
function guardarDB(data) {
  fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
}
function guardarPedido({ userId, nombre, producto, talla, direccion, telefono }) {
  const db = leerDB();
  const pedido = {
    id: Date.now(),
    fecha: new Date().toLocaleString("es-MX", { timeZone: "America/Mazatlan" }),
    userId, nombre: nombre || "Sin nombre",
    producto: producto || "Sin especificar",
    talla: talla || "Sin especificar",
    direccion: direccion || "Sin especificar",
    telefono: telefono || "Sin especificar",
    estado: "pendiente"
  };
  db.pedidos.push(pedido);
  guardarDB(db);
  return pedido;
}
function obtenerPedidosPendientes() {
  return leerDB().pedidos.filter(p => p.estado === "pendiente");
}
module.exports = { guardarPedido, obtenerPedidosPendientes };
