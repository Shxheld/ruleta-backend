import express from "express";
import http from "http";
import { Server } from "socket.io";
import cors from "cors";

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: "*" }
});

let players = [];
let apuestas = [];
let resultadoActual = null;
let tiempoRestante = 15;

setInterval(() => {
  tiempoRestante--;

  if (tiempoRestante <= 0) {
    // Elegir número aleatorio como resultado de ruleta
    resultadoActual = Math.floor(Math.random() * 38); // 0 a 37 (00 es 37)
    io.emit("resultado", resultadoActual);
    evaluarGanadores();

    // Reiniciar ronda
    apuestas = [];
    tiempoRestante = 15;
  }

  io.emit("contador", tiempoRestante);
}, 1000);

function evaluarGanadores() {
  const ganadores = apuestas.filter(a => parseInt(a.numero) === resultadoActual);
  const perdedores = apuestas.filter(a => parseInt(a.numero) !== resultadoActual);

  io.emit("resultado-final", {
    numero: resultadoActual,
    ganadores,
    perdedores
  });
}

io.on("connection", socket => {
  console.log("Un usuario se conectó:", socket.id);

  socket.on("registrar-jugador", nombre => {
    players.push({ id: socket.id, nombre });
    socket.emit("jugador-registrado", nombre);
  });

  socket.on("apostar", apuesta => {
    apuesta.id = socket.id;
    apuestas.push(apuesta);
    io.emit("nueva-apuesta", apuesta);
  });

  socket.on("disconnect", () => {
    players = players.filter(p => p.id !== socket.id);
    apuestas = apuestas.filter(a => a.id !== socket.id);
    console.log("Usuario desconectado:", socket.id);
  });
});

server.listen(3000, () => {
  console.log("Servidor escuchando en puerto 3000");
});
