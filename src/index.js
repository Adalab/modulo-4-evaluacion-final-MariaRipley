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

server.get("/recetas", async (res) => {
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

server.get("/recetas/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const select = "SELECT * FROM recetas WHERE id = ?";
    const conn = await getConnection();
    const [result] = await conn.query(select, id);
    const recipe = result[0];

    res.json({
      nombre: recipe.nombre,
      ingredientes: recipe.ingredientes,
      instrucciones: recipe.instrucciones,
    });

    conn.end();
  } catch (error) {
    console.error("Error en la conexión", error);
    res.status(500).json({ error: "Error en la conexión" });
  }
});

// Crear una nueva receta

server.post("/recetas", async (req, res) => {
  try {
    const newRecipe = req.body;
    const insert =
      "INSERT INTO recetas (nombre, ingredientes, instrucciones) values (?, ?, ?)";
    const conn = await getConnection();
    const [result] = await conn.query(insert, [
      newRecipe.nombre,
      newRecipe.ingredientes,
      newRecipe.instrucciones,
    ]);

    const newRecipeId = result.insertId;
    conn.end();

    res.json({
      success: true,
      id: newRecipeId,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});

// Actualizar una receta existente

server.put("/recetas/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { nombreFront, ingredientesFront, instruccionesFront } = req.body;
    const update =
      "UPDATE recetas SET nombre = ?, ingredientes = ?, instrucciones = ? WHERE id = ?";
    const conn = await getConnection();
    const [result] = await conn.query(update, [
      nombreFront,
      ingredientesFront,
      instruccionesFront,
      id,
    ]);
    conn.end();
    res.json({
      success: true,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});

// Eliminar una receta
