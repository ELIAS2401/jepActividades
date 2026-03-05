const sheetEstudioURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=0&single=true&output=csv";
const sheetInfoURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=443904791&single=true&output=csv";

const tablaBody = document.getElementById("tabla-body");
const titulo = document.getElementById("titulo-estudio");

let datosEstudio = [];
let datosInfo = [];
let mesActual = new Date().getMonth() + 1;
let mesSeleccionado = mesActual;

// ================= CARGA INICIAL =================

Promise.all([
  cargarCSV(sheetInfoURL),
  cargarCSV(sheetEstudioURL)
]).then(([info, estudio]) => {

  datosInfo = info;
  datosEstudio = estudio;

  crearBotonesMeses();
  renderizarMes(mesActual);
});

// ================= FUNCIONES =================

function cargarCSV(url) {
  return new Promise(resolve => {
    Papa.parse(url, {
      download: true,
      header: true,
      complete: results => resolve(results.data)
    });
  });
}

// ---------------- BOTONES ----------------

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

// ---------------- RENDER MES ----------------

function renderizarMes(idMes) {
  tablaBody.innerHTML = "";

  const infoMes = datosInfo.find(m => parseInt(m.idMes) === idMes);

  if (infoMes) {
    titulo.textContent = `${infoMes.Titulo} - ${infoMes.Libro}`;
    crearBotonInfo(infoMes.Información);
  }

  const filas = datosEstudio.filter(f => parseInt(f.Mes) === idMes);

  filas.forEach(fila => {
    if (!fila.Joven) return;

    const hoy = new Date();
    const fechaFila = convertirTextoAFecha(fila.Dia);

    const esHoy =
      fechaFila &&
      fechaFila.getDate() === hoy.getDate() &&
      fechaFila.getMonth() === hoy.getMonth() &&
      fechaFila.getFullYear() === hoy.getFullYear();

    const estado = (fila.Estado || "").trim().toLowerCase();

    const row = document.createElement("tr");

    let estadoHTML = "";
    let botonHTML = "";

    if (estado === "respondida" || estado === "respondido") {
      estadoHTML = `<span class="estado verde">Contestada</span>`;
      botonHTML = `<span class="check">✔</span>`;
    }
    else if (estado === "pendiente") {
      estadoHTML = `<span class="estado amarillo">Pendiente</span>`;
      botonHTML = `
    <button 
      class="btn-responder"
      ${!esHoy ? "disabled" : ""}
      onclick="irAFormulario('${fila.Joven}', '${fila.Pasaje}', '${fila.Dia}')">
      Responder
    </button>`;
    }
    else {
      estadoHTML = `<span class="estado rojo">Sin contestar</span>`;
      botonHTML = `<span class="estado rojo">Sin contestar</span>`;
    }

    row.innerHTML = `
  <td>${fila.Dia}</td>
  <td><strong>${fila.Joven}</strong></td>
  <td>${fila.Pasaje || "-"}</td>
  <td>${botonHTML}</td>
  <td>${estadoHTML}</td>
`;

    tablaBody.appendChild(row);
  });
}

// ---------------- MODAL INFO ----------------

function crearBotonInfo(texto) {
  let btnInfo = document.getElementById("btn-info");

  if (!btnInfo) {
    btnInfo = document.createElement("button");
    btnInfo.id = "btn-info";
    btnInfo.textContent = "📖 Información del libro";
    btnInfo.classList.add("btn-info");

    btnInfo.onclick = () => mostrarModal(texto);

    document.querySelector(".main-header").appendChild(btnInfo);
  } else {
    btnInfo.onclick = () => mostrarModal(texto);
  }
}

function mostrarModal(texto) {
  const modal = document.createElement("div");
  modal.classList.add("modal");

  modal.innerHTML = `
    <div class="modal-content">
      <span class="cerrar">&times;</span>
      <p>${texto}</p>
    </div>
  `;

  document.body.appendChild(modal);

  modal.querySelector(".cerrar").onclick = () => modal.remove();
  modal.onclick = e => { if (e.target === modal) modal.remove(); };
}

// ---------------- UTIL ----------------

function convertirTextoAFecha(texto) {
  if (!texto) return null;

  const partes = texto.split(",");
  if (partes.length < 2) return null;

  const fechaParte = partes[1].trim();
  const [dia, , mes, , anio] = fechaParte.split(" ");

  const meses = {
    enero: 0, febrero: 1, marzo: 2, abril: 3, mayo: 4,
    junio: 5, julio: 6, agosto: 7, septiembre: 8,
    octubre: 9, noviembre: 10, diciembre: 11
  };

  return new Date(anio, meses[mes.toLowerCase()], dia);
}

function irAFormulario(nombre, pasaje, diaTexto) {

  const fechaFila = convertirTextoAFecha(diaTexto);
  const hoy = new Date();

  const esHoy =
    fechaFila &&
    fechaFila.getDate() === hoy.getDate() &&
    fechaFila.getMonth() === hoy.getMonth() &&
    fechaFila.getFullYear() === hoy.getFullYear();

  if (!esHoy) {
    alert("Solo se puede responder el día correspondiente.");
    return;
  }

  const url = `jovenesForm.html?nombre=${encodeURIComponent(nombre)}&pasaje=${encodeURIComponent(pasaje)}&fecha=${encodeURIComponent(diaTexto)}`;

  window.location.href = url;
}