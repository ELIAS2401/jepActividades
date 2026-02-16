const sheetURL = "https://docs.google.com/spreadsheets/d/e/2PACX-1vRA3G3mUJqYv04MxWwEes4s8VLUSrmBAa_vFMX0ENGYKx4bxGUCZClJGh2nDKez0FMOVFhnyc9nlRjE/pub?gid=0&single=true&output=csv";

const tablaBody = document.getElementById("tabla-body");
const titulo = document.getElementById("titulo-estudio");

function formatearFecha(fechaTexto) {
  if (!fechaTexto) return "-";

  // Ejemplo que llega:
  // "domingo, 1 de marzo de 2026"

  const partes = fechaTexto.split(",");
  if (partes.length < 2) return fechaTexto;

  const fechaParte = partes[1].trim(); // "1 de marzo de 2026"
  const [dia, , mes, , anio] = fechaParte.split(" ");

  const meses = {
    enero: 0,
    febrero: 1,
    marzo: 2,
    abril: 3,
    mayo: 4,
    junio: 5,
    julio: 6,
    agosto: 7,
    septiembre: 8,
    octubre: 9,
    noviembre: 10,
    diciembre: 11
  };

  const fecha = new Date(anio, meses[mes.toLowerCase()], dia);

  const opciones = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };

  let fechaFormateada = fecha.toLocaleDateString("es-ES", opciones);

  return fechaFormateada.charAt(0).toUpperCase() + fechaFormateada.slice(1);
}


Papa.parse(sheetURL, {
  download: true,
  header: true,
  complete: function(results) {
    const datos = results.data;

    if (datos.length > 0 && datos[0].Titulo) {
      titulo.textContent = datos[0].Titulo;
    }

    datos.forEach(fila => {
      if (!fila.Joven) return;

      const row = document.createElement("tr");

      row.innerHTML = `
        <td>${formatearFecha(fila.Dia)}</td>
        <td><strong>${fila.Joven}</strong></td>
        <td>${fila.Pasaje || "-"}</td>
        <td>
          <button class="btn-responder"
            onclick="irAFormulario('${fila.Joven}', '${fila.Dia}')">
            Responder
          </button>
        </td>
      `;

      tablaBody.appendChild(row);
    });
  }
});

function irAFormulario(nombre, dia) {
  const url = `responder.html?nombre=${encodeURIComponent(nombre)}&dia=${encodeURIComponent(dia)}`;
  window.location.href = url;
}
