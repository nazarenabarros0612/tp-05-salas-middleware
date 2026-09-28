const express = require("express");
const expressLayouts = require("express-ejs-layouts");
const morgan = require("morgan");
const path = require("node:path");

const PORT = 3000;

const salasPermitidas = [
  "Sala Norte",
  "Sala Sur",
  "Sala Multimedia",
];

let numeroDeSolicitud = 0;

const reservas = [
  {
    id: 1,
    estudiante: "Lucía Gómez",
    email: "lucia@gmail.com",
    sala: "Sala Norte",
    fecha: "2026-09-23",
    turno: "Mañana",
    personas: 2,
  },
  {
    id: 2,
    estudiante: "Mateo Fernández",
    email: "mateo@gmail.com",
    sala: "Sala Sur",
    fecha: "2026-09-24",
    turno: "Tarde",
    personas: 4,
  },
  {
    id: 3,
    estudiante: "Sofía Martínez",
    email: "sofia@gmail.com",
    sala: "Sala Multimedia",
    fecha: "2026-09-25",
    turno: "Noche",
    personas: 3,
  },
  {
    id: 4,
    estudiante: "Tomás Rodríguez",
    email: "tomas@gmail.com",
    sala: "Sala Norte",
    fecha: "2026-09-26",
    turno: "Tarde",
    personas: 1,
  },
];

function identificarSolicitud(req, res, next) {
  numeroDeSolicitud += 1;
  res.locals.solicitudId = `BIB-${String(numeroDeSolicitud).padStart(4, "0")}`;
  next();
}

function medirDuracion(req, res, next) {
  const inicio = process.hrtime.bigint();

  res.on("finish", () => {
    const fin = process.hrtime.bigint();
    const milisegundos = Number(fin - inicio) / 1_000_000;

    console.log(
      `[${res.locals.solicitudId}] ${req.method} ${req.originalUrl} ` +
      `${res.statusCode} ${milisegundos.toFixed(2)} ms`,
    );
  });

  next();
}

function prepararAreaReservas(req, res, next) {
  res.locals.seccion = "Reservas de salas";
  next();
}

function validarReserva(req, res, next) {
  const estudiante = String(req.body.estudiante ?? "").trim();
  const email = String(req.body.email ?? "").trim();
  const sala = String(req.body.sala ?? "").trim();
  const fecha = String(req.body.fecha ?? "").trim();
  const turno = String(req.body.turno ?? "").trim();
  const personas = Number(req.body.personas);

  const emailValido = email.includes("@");
  const personasValidas =
    Number.isInteger(personas) &&
    personas >= 1 &&
    personas <= 6;

  if (
    !estudiante ||
    !email ||
    !sala ||
    !fecha ||
    !turno ||
    !emailValido ||
    !salasPermitidas.includes(sala) ||
    !["Mañana", "Tarde", "Noche"].includes(turno) ||
    !personasValidas
  ) {
    return res.status(400).render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: "Completá todos los campos con valores válidos.",
      valores: req.body,
    });
  }

  req.reservaValidada = {
    estudiante,
    email,
    sala,
    fecha,
    turno,
    personas,
  };

  next();
}

async function main() {
  const app = express();

  function crearReserva(req, res) {
    const ultimoId = reservas.reduce(
      (mayorId, reserva) => Math.max(mayorId, reserva.id),
      0,
    );

    reservas.push({
      id: ultimoId + 1,
      ...req.reservaValidada,
    });

    res.redirect("/reservas");
  }

  app.set("view engine", "ejs");
  app.set("views", path.join(__dirname, "..", "views"));
  app.set("layout", "layouts/main");

  app.use(morgan("dev"));
  app.use(identificarSolicitud);
  app.use(medirDuracion);

  app.use(expressLayouts);
  app.use(express.static(path.join(__dirname, "..", "public")));
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  app.get("/", (req, res) => {
    res.render("inicio", {
      titulo: "Salas de estudio",
    });
  });

  app.get("/estado", (req, res) => {
    res.json({
      servicio: "activo",
      reservas: reservas.length,
      solicitudId: res.locals.solicitudId,
    });
  });

  const reservasRouter = express.Router();

  reservasRouter.use(prepararAreaReservas);

  reservasRouter.get("/", (req, res) => {
    res.render("reservas/lista", {
      titulo: "Reservas de salas",
      reservas,
    });
  });

  reservasRouter.get("/nueva", (req, res) => {
    res.render("reservas/nueva", {
      titulo: "Nueva reserva",
      error: null,
      valores: {},
    });
  });

  reservasRouter.get("/:id", (req, res) => {
    const id = Number(req.params.id);
    const reserva = reservas.find(
      (elemento) => elemento.id === id,
    );

    if (!reserva) {
      return res.status(404).render("no-encontrado", {
        titulo: "Reserva no encontrada",
        mensaje: "No existe una reserva con ese identificador.",
      });
    }

    res.render("reservas/detalle", {
      titulo: `Reserva #${reserva.id}`,
      reserva,
    });
  });

  reservasRouter.post("/", validarReserva, crearReserva);

  app.use("/reservas", reservasRouter);

  app.use((req, res) => {
    res.status(404).render("no-encontrado", {
      titulo: "Página no encontrada",
      mensaje: "La dirección solicitada no existe.",
    });
  });

  app.listen(PORT, () => {
    console.log(`Aplicación disponible en http://localhost:${PORT}`);
  });
}

main().catch((error) => {
  console.error("No se pudo iniciar la aplicación:", error);
  process.exitCode = 1;
});