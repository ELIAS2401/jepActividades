const sheetEstudioURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=0&single=true&output=csv";
const sheetInfoURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=443904791&single=true&output=csv";
const sheetRespuestasURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=622291790&single=true&output=csv";

const tablaBody = document.getElementById("tabla-body");
const titulo = document.getElementById("titulo-estudio");

let datosEstudio = [];
let datosInfo = [];
let datosRespuestas = [];

let mesActual = new Date().getMonth() + 1;
let mesSeleccionado = mesActual;

Promise.all([
  cargarCSV(sheetInfoURL),
  cargarCSV(sheetEstudioURL),
  cargarCSV(sheetRespuestasURL)
]).then(([info, estudio, respuestas]) => {

  datosInfo = info;
  datosEstudio = estudio;
  datosRespuestas = respuestas;

  crearBotonesMeses();
  renderizarMes(mesActual);
});

function cargarCSV(url) {
  return new Promise(resolve => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: results => resolve(results.data)
    });
  });
}

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
      renderizarMes(mesSeleccionado);
      document.querySelectorAll(".btn-mes").forEach(b => b.classList.remove("activo"));
      btn.classList.add("activo");
    };

    contenedor.appendChild(btn);
  });

  document.body.insertBefore(contenedor, document.querySelector(".tabla-wrapper"));
}

function renderizarMes(idMes) {
  tablaBody.innerHTML = "";

  const infoMes = datosInfo.find(m => parseInt(m.idMes) === idMes);

  if (infoMes) {
    titulo.textContent = `${infoMes.Titulo} - ${infoMes.Libro}`;
  }

  const filas = datosEstudio.filter(f => parseInt(f.Mes) === idMes);

  filas.forEach(fila => {

    if (!fila.Joven) return;

    const hoy = new Date();
    const fechaFila = convertirTextoAFecha(fila.Dia);
    const diaSemana = fechaFila ? obtenerDiaSemana(fechaFila) : "";
    const esHoy =
      fechaFila &&
      fechaFila.getDate() === hoy.getDate() &&
      fechaFila.getMonth() === hoy.getMonth() &&
      fechaFila.getFullYear() === hoy.getFullYear();

    const yaRespondio = datosRespuestas.some(r =>
      parseInt(r.Mes) === idMes &&
      r.Joven === fila.Joven &&
      r.Fecha === fila.Dia
    );

    let estadoHTML = "";
    let botonHTML = "";

    if (yaRespondio) {
      estadoHTML = `<span class="estado verde">Contestada</span>`;
      botonHTML = `<span class="check">✔</span>`;
    }
    else if (esHoy) {
      estadoHTML = `<span class="estado amarillo">Pendiente</span>`;
      botonHTML = `
                <button class="btn-responder"
                    onclick="irAFormulario('${fila.Joven}', '${fila.Pasaje}', '${fila.Dia}', ${idMes})">
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

function convertirTextoAFecha(texto) {
  if (!texto) return null;

  const partes = texto.split("/");

  if (partes.length !== 3) return null;

  const dia = parseInt(partes[0]);
  const mes = parseInt(partes[1]) - 1; // JS empieza en 0
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

function irAFormulario(nombre, pasaje, fecha, mes) {
  const url = `jovenesForm.html?nombre=${encodeURIComponent(nombre)}&pasaje=${encodeURIComponent(pasaje)}&fecha=${encodeURIComponent(fecha)}&mes=${mes}`;
  window.location.href = url;
}

function abrirModal() {
  const infoMes = datosInfo.find(m => parseInt(m.idMes) === mesSeleccionado);
  if (!infoMes) return;

  const modal = document.getElementById("modal-info");

  modal.querySelector(".modal-title").textContent =
    `${infoMes.Titulo} - ${infoMes.Libro}`;

  const texto = infoMes["Información"] || "Sin información disponible.";

  // separa por -
  const partes = texto.split("-");

  // genera HTML con saltos de línea
  const html = partes.map(p => `<div class="info-linea">${p.trim()}</div>`).join("");

  modal.querySelector(".modal-content").innerHTML = html;

  modal.style.display = "flex";
}

function cerrarModal() {
  document.getElementById("modal-info").style.display = "none";
}