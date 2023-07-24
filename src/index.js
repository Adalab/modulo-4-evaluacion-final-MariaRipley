// Servidor Express

// Para probar los ficheros estáticos del fronend, entrar en <http://localhost:4500/>
// Para probar el API, entrar en <http://localhost:4500/api/items>

// Imports

const express = require("express");
const cors = require("cors");
const mysql = require("mysql2/promise");
require("dotenv").config();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");

// Arracar el servidor

const server = express();

// Bases de datos

const recetasDB = "recetas_db";
const usuariosDB = "usuarios_db";

// Token
const generateToken = (payload) => {
  const token = jwt.sign(payload, "secreto", { expiresIn: "24h" });
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, "secreto");
    return decoded;
  } catch (err) {
    return null;
  }
};

// Configuración del servidor

server.use(cors());
server.use(express.json({ limit: "25mb" }));

// Conexion a la base de datos

async function getConnection(dbName) {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || "localhost",
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASS,
    database:
      dbName == recetasDB
        ? process.env.DB_NAME
        : dbName == usuariosDB
        ? process.env.DB_NAME_USERS
        : "Clase",
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
    const conn = await getConnection(recetasDB);
    const [results] = await conn.query(select);
    const numOfElements = results.length;

    res.json({
      info: { count: numOfElements },
      results: results,
    });

    conn.end();
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});

// Obtener una receta por su ID

server.get("/recetas/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const select = "SELECT * FROM recetas WHERE id = ?";
    const conn = await getConnection(recetasDB);
    const [result] = await conn.query(select, id);
    const recipe = result[0];

    res.json({
      nombre: recipe.nombre,
      ingredientes: recipe.ingredientes,
      instrucciones: recipe.instrucciones,
    });

    conn.end();
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});

// Crear una nueva receta

server.post("/recetas", async (req, res) => {
  try {
    const newRecipe = req.body;
    const insert =
      "INSERT INTO recetas (nombre, ingredientes, instrucciones) values (?, ?, ?)";
    const conn = await getConnection(recetasDB);
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
    const conn = await getConnection(recetasDB);
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

server.delete("/recetas/:id", async (req, res) => {
  const id = req.params.id;
  try {
    const deleteRecipe = "DELETE FROM recetas WHERE id = ?";
    const conn = await getConnection(recetasDB);
    const [result] = await conn.query(deleteRecipe, id);
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

// Registro de usuarios

server.post("/registro", async (req, res) => {
  try {
    const newUser = req.body;
    const insert =
      "INSERT INTO usuarios (email, nombre, `password`) values (?, ?, ?)";
    const conn = await getConnection(usuariosDB);
    const passwordHash = await bcrypt.hash(newUser.password, 10);

    const [result] = await conn.query(insert, [
      newUser.email,
      newUser.nombre,
      passwordHash,
    ]);
    const newUserId = result.insertId;
    conn.end();

    const token = jwt.sign(
      {
        id: newUserId,
        email: newUser.email,
      },
      "secreto_jwt"
    );

    res.json({
      success: true,
      token: token,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});

// Inicio de sesión

server.post("/login", async (req, res) => {
  const body = req.body;

  //Buscar usuario por email en la base de datos
  try {
    let sql = "SELECT * FROM usuarios WHERE email = ?";
    const conn = await getConnection(usuariosDB);
    const [users] = await conn.query(sql, [body.email]);
    conn.end();
    const usuario = users[0];
    console.log(usuario);

    //Comprobar la contraseña
    const passwordMatch =
      usuario === null
        ? false
        : await bcrypt.compare(body.password, usuario.password);

    // Si no existe el usuario o el password no es correcto
    if (!(usuario && passwordMatch)) {
      return res.status(401).json({
        error: "Invalid user or password",
      });
    }

    // Generar token si password es correcta
    const userForToken = {
      email: usuario.email,
      password: usuario.password,
    };

    const token = generateToken(userForToken);

    // Enviar respuesta correcta

    res.status(200).json({
      token,
      email: usuario.email,
    });
  } catch (error) {
    res.json({
      success: false,
      message: error,
    });
  }
});
