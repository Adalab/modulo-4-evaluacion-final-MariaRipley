// Servidor Express

// Para probar los ficheros estáticos del fronend, entrar en <http://localhost:4500/>
// Para probar el API, entrar en <http://localhost:4500/api/items>

// Imports

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();

// Arracar el servidor

const server = express();

// Configuración del servidor

server.use(cors());
server.use(express.json({ limit: "25mb" }));

// Conexion a la base de datos

async function getConnection() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS,
    database: process.env.DB_NAME || "Clase",
  });

  connection.connect();

  return connection;
}

// Poner a escuchar el servidor

const port = process.env.PORT || 4500;
server.listen(port, () => {
  console.log(`Ya se ha arrancado nuestro servidor: http://localhost:${port}/`);
});

// Endpoints

// Obtener todas las recetas

server.get("/recetas", async (req, res) => {
  try {
    const select = "SELECT * FROM recetas";
    const conn = await getConnection();
    const [results] = await conn.query(select);

    const numOfElements = results.length;
    res.json({
      info: { count: numOfElements },
      results: results,
    });

    conn.end();
  } catch (error) {
    console.error("Error en la conexión", error);
    res.status(500).json({ error: "Error en la conexión" });
  }
});

// Obtener una receta por su ID

server.get("/recetas/:id");
