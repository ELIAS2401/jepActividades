const sheetEstudioURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=0&single=true&output=csv";
const sheetInfoURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=443904791&single=true&output=csv";
const WEBAPP_URL = "https://script.google.com/macros/s/AKfycbzI33eyhIu3JsecAlM_R0oVA1PnccmHihBYcbmvyNSxZo5xekwjdQSF-hqfRju2R-0eEA/exec";
const tablaBody = document.getElementById("tabla-body");
const titulo = document.getElementById("titulo-estudio");

let datosEstudio = [];
let datosInfo = [];

const mesActual = new Date().getMonth() + 1;
let mesSeleccionado = mesActual;

const loaderRespuestas = document.getElementById("loader-respuestas");
const contenidoRespuestas = document.getElementById("contenido-respuestas");

/* ---------------- CARGA DE DATOS ---------------- */

Promise.all([
  cargarCSV(sheetInfoURL),
  cargarCSV(sheetEstudioURL)
]).then(([info, estudio]) => {

  datosInfo = info;
  datosEstudio = estudio;

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

/* ---------------- BOTONES DE MESES ---------------- */

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

/* ---------------- RENDER TABLA ---------------- */

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

    const esHoy =
      fechaFila &&
      fechaFila.getDate() === hoy.getDate() &&
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

    }
    else if (esHoy) {

      estadoHTML = `<span class="estado amarillo">Pendiente</span>`;

      botonHTML = `
        <button class="btn-responder"
          onclick="irAFormulario('${fila.ID}','${fila.Joven}','${fila.Pasaje}','${fila.Dia}',${idMes})">
          Responder
        </button>`;

    }
    else if (fechaFila && fechaFila < hoy) {

      estadoHTML = `<span class="estado rojo">No contestada</span>`;
      botonHTML = `<span class="estado rojo">No disponible</span>`;

    }
    else {

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
    "domingo",
    "lunes",
    "martes",
    "miércoles",
    "jueves",
    "viernes",
    "sábado"
  ];

  return dias[fecha.getDay()];
}

/* ---------------- FORMULARIO ---------------- */

function irAFormulario(id, nombre, pasaje, fecha, mes) {

  const url =
    `jovenesForm.html?id=${id}` +
    `&nombre=${encodeURIComponent(nombre)}` +
    `&pasaje=${encodeURIComponent(pasaje)}` +
    `&fecha=${encodeURIComponent(fecha)}` +
    `&mes=${mes}`;

  window.location.href = url;

}

/* ---------------- MODAL ---------------- */

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

  const partes = texto.split("-");

  const html = partes
    .map(p => `<div class="info-linea">${p.trim()}</div>`)
    .join("");

  modal.querySelector(".modal-content").innerHTML = html;

  modal.style.display = "flex";

}

function cerrarModal() {
  document.getElementById("modal-info").style.display = "none";
}

async function verRespuestas(id) {

  const modal = document.getElementById("modal-respuestas");

  modal.style.display = "flex";

  loaderRespuestas.style.display = "block";
  contenidoRespuestas.style.display = "none";

  try {

    const res = await fetch(`${WEBAPP_URL}?idEstudio=${id}`);
    const data = await res.json();

    if (data.status === "YA_RESPONDIDA") {

      document.getElementById("mr1").textContent = data.r1 || "-";
      document.getElementById("mr2").textContent = data.r2 || "-";
      document.getElementById("mr3").textContent = data.r3 || "-";
      document.getElementById("mr4").textContent = data.r4 || "-";
      document.getElementById("mr5").textContent = data.r5 || "-";

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

function abrirModalRespuestas(data) {

  const modal = document.getElementById("modal-respuestas");

  document.getElementById("mr1").textContent = data.r1 || "-";
  document.getElementById("mr2").textContent = data.r2 || "-";
  document.getElementById("mr3").textContent = data.r3 || "-";
  document.getElementById("mr4").textContent = data.r4 || "-";
  document.getElementById("mr5").textContent = data.r5 || "-";

  modal.style.display = "flex";

}

function cerrarModalRespuestas() {
  document.getElementById("modal-respuestas").style.display = "none";
}