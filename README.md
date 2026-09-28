Trabajo práctico 05

Descripción

Aplicación web desarrollada con Express para consultar salas de estudio y registrar temporalmente reservas de turnos.

Las reservas iniciales y las nuevas reservas se mantienen únicamente en memoria. Al reiniciar la aplicación, se recuperan solamente las reservas definidas al inicio.

Instalación

Para instalar las dependencias del proyecto:

npm install

Ejecución

Para iniciar el servidor:

npm start

La aplicación queda disponible en:

http://localhost:3000

Para comprobar la sintaxis de "src/index.js":

npm run check

Rutas

Método| Ruta| Descripción
GET| "/"| Página de inicio
GET| "/estado"| Estado del servicio en formato JSON
GET| "/reservas"| Listado de reservas
GET| "/reservas/nueva"| Formulario de nueva reserva
GET| "/reservas/:id"| Detalle de una reserva
POST| "/reservas"| Validación y creación de una reserva

La ruta "/reservas/nueva" se declara antes de "/reservas/:id" para que "nueva" no sea interpretado como un identificador.

Pipeline de middleware

El recorrido global de las solicitudes respeta el siguiente orden:

morgan("dev")
↓
identificarSolicitud
↓
medirDuracion
↓
expressLayouts
↓
express.static
↓
express.urlencoded
↓
express.json
↓
rutas de aplicación
↓
reservasRouter
↓
página 404

POST válido

POST /reservas
↓
morgan("dev")
↓
identificarSolicitud
↓
medirDuracion
↓
expressLayouts
↓
express.urlencoded
↓
reservasRouter
↓
prepararAreaReservas
↓
validarReserva
↓
crearReserva
↓
302 /reservas
↓
finish: ID + estado + duración

POST inválido

POST /reservas
↓
morgan("dev")
↓
identificarSolicitud
↓
medirDuracion
↓
expressLayouts
↓
express.urlencoded
↓
reservasRouter
↓
prepararAreaReservas
↓
validarReserva
↓
400 + render del formulario
↓
finish: ID + estado + duración

El POST inválido termina en "validarReserva", por lo que "crearReserva" no se ejecuta.

Alcance de cada función

Middleware global

"morgan("dev")", "identificarSolicitud" y "medirDuracion" se registran con "app.use()" y pueden participar en las solicitudes que alcanzan esas líneas.

Middleware incorporado

"express.static()" permite servir los recursos públicos.

"express.urlencoded()" interpreta los datos enviados por el formulario HTML y los coloca en "req.body".

"express.json()" permite interpretar cuerpos enviados en formato JSON.

Los parsers aparecen antes de la validación porque "validarReserva" necesita utilizar "req.body".

Middleware de terceros

Morgan es un middleware de terceros utilizado para registrar información técnica de las solicitudes HTTP, como método, ruta, estado y tiempo.

Middleware personalizado

"identificarSolicitud" genera un identificador consecutivo y lo guarda en "res.locals.solicitudId".

"medirDuracion" registra el momento inicial y agrega un listener al evento "finish" para calcular la duración cuando la respuesta ya terminó.

Middleware de router

"prepararAreaReservas" se registra dentro de "reservasRouter" y prepara:

res.locals.seccion = "Reservas de salas"

Este valor se utiliza en las vistas del área de reservas.

Middleware de ruta

"validarReserva" se aplica solamente al "POST /reservas".

Si los datos son inválidos, responde con estado "400" y vuelve a mostrar el formulario.

Si los datos son válidos, prepara "req.reservaValidada" y ejecuta "next()" para que continúe "crearReserva".

Validación

La validación se realiza en el servidor.

Se comprueban:

- estudiante no vacío;
- email no vacío;
- email con "@";
- sala permitida;
- fecha no vacía;
- turno permitido;
- cantidad de personas entera;
- cantidad de personas entre 1 y 6.

Las salas permitidas son:

Sala Norte
Sala Sur
Sala Multimedia

Los turnos permitidos son:

Mañana
Tarde
Noche

Cuando los datos son inválidos se responde con "400" y se conservan los valores enviados para volver a mostrarlos en el formulario.

Pruebas manuales

Se deben comprobar los siguientes casos:

- Inicio: estado "200".
- Estado: estado "200" y respuesta JSON.
- Listado: estado "200" y cuatro o más reservas.
- Estado vacío: mensaje alternativo.
- Formulario: estado "200" y controles etiquetados.
- Detalle válido: estado "200".
- Detalle inexistente: estado "404".
- Campos vacíos: estado "400".
- Sala no permitida: estado "400".
- Turno no permitido: estado "400".
- Email sin "@": estado "400".
- Personas igual a "0": estado "400".
- Personas igual a "7": estado "400".
- Reserva válida: estado "302" y luego "200".
- URL inexistente: estado "404".
- Reinicio: regreso a las reservas iniciales.

En cada prueba también se debe revisar la salida de Morgan y la línea de medición personalizada.

Persistencia temporal

Las reservas se almacenan en un arreglo dentro de "src/index.js".

No se escriben nuevas reservas en archivos ni en una base de datos.

Por este motivo, cuando la aplicación se reinicia, las reservas creadas durante la ejecución desaparecen y vuelven a estar disponibles únicamente las reservas iniciales.

Diferencia entre tipos de middleware

El middleware incorporado forma parte de Express, como "express.urlencoded()" y "express.json()".

El middleware de terceros se instala como dependencia, como Morgan.

El middleware personalizado es creado para la aplicación, como "identificarSolicitud", "medirDuracion", "prepararAreaReservas" y "validarReserva".

Uso de "next()"

"next()" permite que una solicitud continúe hacia el siguiente middleware o handler correspondiente.

Un middleware que continúa debe ejecutar "next()".

Cuando un middleware responde directamente, no debe ejecutar "next()" después de esa respuesta.

Motivo del evento "finish"

El evento "finish" permite medir la duración hasta que la respuesta termina.

La duración no se calcula inmediatamente después de "next()" porque en ese momento el resto del pipeline todavía puede no haber terminado.

Montaje del router

El router se monta de esta manera:

app.use("/reservas", reservasRouter);

Por eso las rutas declaradas dentro del router son relativas al montaje.

Por ejemplo:

reservasRouter.get("/");

produce:

GET /reservas

Y:

reservasRouter.get("/nueva");

produce:

GET /reservas/nueva

No se debe repetir "/reservas" dentro del router.

POST 302 y GET posterior

Cuando una reserva es válida, "crearReserva" agrega la reserva en memoria y ejecuta:

res.redirect("/reservas");

La respuesta inicial es "302".

Después, el navegador realiza un nuevo "GET /reservas", que permite mostrar nuevamente el listado con la reserva agregada.

Persistencia al reiniciar

Las altas realizadas durante la ejecución solamente existen en memoria.

Al reiniciar Node.js se vuelve a ejecutar el código inicial y el arreglo recupera solamente las cuatro reservas definidas al comienzo.