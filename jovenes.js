const sheetEstudioURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=0&single=true&output=csv";
const sheetInfoURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=443904791&single=true&output=csv";
const sheetPreguntasURL = "https://docs.google.com/spreadsheets/d/1M8gOMM9LyiuZMKPGFXETWRvD6XR6jIhZHDl9hf2CtpU/export?format=csv&gid=1521895597";
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbz7O3TMJZH56ms3PGkCzldX5O5vVfkyhKTN0z2C_yQOVRQRQqiyGukbXRyyNc8BIgs3jA/exec";

const tablaBody = document.getElementById("tabla-body");
const titulo = document.getElementById("titulo-estudio");

let datosEstudio = [];
let datosInfo = [];
let datosPreguntas = [];

const mesActual = new Date().getMonth() + 1;
let mesSeleccionado = mesActual;

const loaderRespuestas = document.getElementById("loader-respuestas");
const contenidoRespuestas = document.getElementById("contenido-respuestas");

/* ---------------- CARGA DE DATOS ---------------- */

Promise.all([
  cargarCSV(sheetInfoURL),
  cargarCSV(sheetEstudioURL),
  cargarCSV(sheetPreguntasURL)
]).then(([info, estudio, preguntas]) => {

  datosInfo = info;
  datosEstudio = estudio;
  datosPreguntas = preguntas;

  crearBotonesMeses();
  renderizarMes(mesActual);
});

function cargarCSV(url) {
  return new Promise(resolve => {
    Papa.parse(url + "&t=" + Date.now(), {
      download: true,
      header: true,
      complete: results => resolve(results.data)
    });
  });
}

/* ---------------- PREGUNTAS ---------------- */

function obtenerPreguntas(mes) {
  return datosPreguntas.find(p => parseInt(p.idMes) === parseInt(mes));
}

/* ---------------- BOTONES ---------------- */

function crearBotonesMeses() {

  const contenedor = document.createElement("div");
  contenedor.classList.add("meses-container");

  datosInfo.forEach(mes => {

    if (!mes.idMes) return;

    const btn = document.createElement("button");
    btn.textContent = mes.Mes;
    btn.classList.add("btn-mes");

    if (parseInt(mes.idMes) === mesActual) {
      btn.classList.add("activo");
    }

    btn.onclick = () => {

      mesSeleccionado = parseInt(mes.idMes);

      document.querySelectorAll(".btn-mes")
        .forEach(b => b.classList.remove("activo"));

      btn.classList.add("activo");

      renderizarMes(mesSeleccionado);
    };

    contenedor.appendChild(btn);

  });

  document.body.insertBefore(
    contenedor,
    document.querySelector(".tabla-wrapper")
  );
}

/* ---------------- TABLA ---------------- */

function renderizarMes(idMes) {

  tablaBody.innerHTML = "";

  const infoMes = datosInfo.find(m => parseInt(m.idMes) === idMes);

  if (infoMes) {
    titulo.textContent = `${infoMes.Titulo} - ${infoMes.Libro}`;
  }

  const filas = datosEstudio.filter(
    f => parseInt(f.Mes) === idMes
  );

  const hoy = new Date();

  filas.forEach(fila => {

    if (!fila.Joven) return;

    const fechaFila = convertirTextoAFecha(fila.Dia);

    const diaSemana = fechaFila
      ? obtenerDiaSemana(fechaFila)
      : "";

    const esMismoMes =
      fechaFila &&
      fechaFila.getMonth() === hoy.getMonth() &&
      fechaFila.getFullYear() === hoy.getFullYear();

    const yaRespondio = fila.Estado?.trim().toLowerCase() === "contestada";

    let estadoHTML = "";
    let botonHTML = "";

    if (yaRespondio) {

      estadoHTML = `<span class="estado verde">Contestada</span>`;

      botonHTML = `
        <button class="btn-responder"
          onclick="verRespuestas('${fila.ID}')">
          👁 Ver respuestas
        </button>
      `;

    } else if (esMismoMes) {

      estadoHTML = `<span class="estado amarillo">Pendiente</span>`;

      botonHTML = `
        <button class="btn-responder"
          onclick="irAFormulario('${fila.ID}','${fila.Joven}','${fila.Pasaje}','${fila.Dia}',${idMes})">
          Responder
        </button>`;

    } else if (fechaFila && fechaFila < hoy) {

      estadoHTML = `<span class="estado rojo">No contestada</span>`;
      botonHTML = `<span class="estado rojo">No disponible</span>`;

    } else {

      estadoHTML = `<span class="estado gris">Próximamente</span>`;
      botonHTML = `<span class="estado gris">-</span>`;

    }

    const row = document.createElement("tr");

    row.innerHTML = `
      <td>
        <div class="fecha-dia">${diaSemana}</div>
        <div class="fecha-num">${fila.Dia}</div>
      </td>
      <td><strong>${fila.Joven}</strong></td>
      <td>${fila.Pasaje || "-"}</td>
      <td>${botonHTML}</td>
      <td>${estadoHTML}</td>
    `;

    tablaBody.appendChild(row);

  });

}

/* ---------------- FECHAS ---------------- */

function convertirTextoAFecha(texto) {

  if (!texto) return null;

  const partes = texto.split("/");

  if (partes.length !== 3) return null;

  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1;
  const anio = parseInt(partes[2]);

  return new Date(anio, mes, dia);

}

function obtenerDiaSemana(fecha) {

  const dias = [
    "domingo","lunes","martes","miércoles","jueves","viernes","sábado"
  ];

  return dias[fecha.getDay()];
}

/* ---------------- FORM ---------------- */

function irAFormulario(id, nombre, pasaje, fecha, mes) {

  const url =
    `jovenesForm.html?id=${id}` +
    `&nombre=${encodeURIComponent(nombre)}` +
    `&pasaje=${encodeURIComponent(pasaje)}` +
    `&fecha=${encodeURIComponent(fecha)}` +
    `&mes=${mes}`;

  window.location.href = url;

}

/* ---------------- RESPUESTAS ---------------- */

async function verRespuestas(id) {

  const modal = document.getElementById("modal-respuestas");

  modal.style.display = "flex";

  loaderRespuestas.style.display = "block";
  contenidoRespuestas.style.display = "none";

  try {

    const res = await fetch(`${WEBAPP_URL}?idEstudio=${id}`);
    const data = await res.json();

    if (data.status === "YA_RESPONDIDA") {

      const fila = datosEstudio.find(f => f.ID == id);
      const preguntas = obtenerPreguntas(fila?.Mes);

      // Reset UI
      document.getElementById("card4")?.style.setProperty("display", "none");
      document.getElementById("card5")?.style.setProperty("display", "none");

      // TITULOS (fallback por si no hay preguntas)
      document.getElementById("t1").textContent = preguntas?.p1 || "Pregunta 1";
      document.getElementById("t2").textContent = preguntas?.p2 || "Pregunta 2";
      document.getElementById("t3").textContent = preguntas?.p3 || "Pregunta 3";

      // RESPUESTAS
      document.getElementById("mr1").textContent = data.r1 || "-";
      document.getElementById("mr2").textContent = data.r2 || "-";
      document.getElementById("mr3").textContent = data.r3 || "-";

      // P4
      if (data.r4) {
        document.getElementById("card4").style.display = "block";
        document.getElementById("t4").textContent = preguntas?.p4 || "Pregunta 4";
        document.getElementById("mr4").textContent = data.r4;
      }

      // P5
      if (data.r5) {
        document.getElementById("card5").style.display = "block";
        document.getElementById("t5").textContent = preguntas?.p5 || "Pregunta 5";
        document.getElementById("mr5").textContent = data.r5;
      }

      loaderRespuestas.style.display = "none";
      contenidoRespuestas.style.display = "block";

    } else {

      loaderRespuestas.style.display = "none";
      alert("Todavía no hay respuestas.");

    }

  } catch (err) {

    loaderRespuestas.style.display = "none";
    alert("Error al cargar respuestas");

  }

}

function cerrarModalRespuestas() {
  document.getElementById("modal-respuestas").style.display = "none";
}

function abrirModal() {

  const infoMes = datosInfo.find(
    m => parseInt(m.idMes) === mesSeleccionado
  );

  if (!infoMes) return;

  const modal = document.getElementById("modal-info");

  modal.querySelector(".modal-title").textContent =
    `${infoMes.Titulo} - ${infoMes.Libro}`;

  const texto =
    infoMes["Información"] || "Sin información disponible.";

  const partes = texto.split("\n");

  const html = partes
    .map(p => `<div class="info-linea">${p.trim()}</div>`)
    .join("");

  modal.querySelector(".modal-content").innerHTML = html;

  modal.style.display = "flex";

}

function cerrarModal() {
  document.getElementById("modal-info").style.display = "none";
}