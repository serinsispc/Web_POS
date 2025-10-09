/* hv.btn.misc.js
   - Descargar, Imprimir, Ver Detalle, Aumentar número, Clonar (placeholders si aplica)
   - Export CSV desde la tabla
*/
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    function requireSel() {
        if (!HV.selected || !HV.selected.idVenta) {
            alert("Selecciona una venta primero.");
            return false;
        }
        return true;
    }

    function exportCSV() {
        const table = document.querySelector("#tablaHV");
        if (!table) { alert("No se encontró la tabla."); return; }
        const tbody = table.querySelector("tbody");
        const rows = tbody ? tbody.querySelectorAll("tr") : [];
        if (!rows || rows.length === 0) { alert("No hay datos para exportar."); return; }

        const sep = ";";
        const headers = ["Número", "Fecha", "Tipo", "Total", "Forma de Pago", "Medio de Pago", "Estado", "NIT", "Cliente", "Estado FE"];
        const out = [headers.join(sep)];

        rows.forEach(function (tr) {
            if (tr.classList.contains("row-details")) return;
            const tds = tr.querySelectorAll("td");
            if (!tds || tds.length === 0) return;

            function get(colName, fallbackIndex) {
                const el = tr.querySelector('td[data-col="' + colName + '"]');
                if (el) return (el.textContent || "").trim();
                const td = tds[fallbackIndex];
                return td ? (td.textContent || "").trim() : "";
            }

            const fila = [
                get("numeroVenta", 0),
                get("fechaVenta", 1),
                get("tipoFactura", 2),
                (get("total", 3) || "").replace(/\./g, ","), // opcional
                get("formaDePago", 4),
                get("medioDePago", 5),
                get("estadoVenta", 6),
                get("nit", 7),
                get("nombreCliente", 8),
                get("estadoFE", 9)
            ];
            out.push(fila.join(sep));
        });

        const csv = out.join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const hoy = new Date(), stamp = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
        a.href = url;
        a.download = "historial_ventas_" + stamp + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    document.addEventListener("DOMContentLoaded", function () {
        HV.byId("actExportar")?.addEventListener("click", exportCSV);
        HV.byId("btnExportar")?.addEventListener("click", exportCSV);
        HV.byId("btnImprimir")?.addEventListener("click", () => window.print());
        HV.byId("actImprimir")?.addEventListener("click", () => window.print());

        HV.byId("actVerDetalle")?.addEventListener("click", function () {
            if (!requireSel()) return;
            const json = JSON.stringify(HV.selected, null, 2);
            if (window.Swal && typeof Swal.fire === 'function') {
                Swal.fire({
                    icon: 'info',
                    title: 'Venta seleccionada',
                    html: '<pre style="text-align:left;white-space:pre-wrap;word-break:break-word;max-height:50vh;overflow:auto;margin:0">' + json.replace(/</g, '&lt;') + '</pre>',
                    showConfirmButton: true,
                    confirmButtonText: 'Copiar JSON',
                    showDenyButton: true,
                    denyButtonText: 'Cerrar'
                }).then(r => {
                    if (r.isConfirmed && navigator.clipboard) {
                        navigator.clipboard.writeText(json).then(() => Swal.fire('Copiado', 'JSON copiado al portapapeles.', 'success'));
                    }
                });
            } else {
                console.log('[Venta seleccionada]', HV.selected);
                alert('Venta seleccionada impresa en la consola del navegador.');
            }
        });

        // Placeholders (ajusta cuando tengas endpoints finales)
        HV.byId("actDescargarFactura")?.addEventListener("click", function () { if (!requireSel()) return; alert("Descargar Factura (por implementar)"); });
        HV.byId("actAumentarNumero")?.addEventListener("click", function () { if (!requireSel()) return; alert("Aumentar número (por implementar)"); });
        HV.byId("actClonar")?.addEventListener("click", function () { if (!requireSel()) return; alert("Clonar (por implementar)"); });
        HV.byId("actDevolucion")?.addEventListener("click", function () { if (!requireSel()) return; alert("Devolución (por implementar)"); });
        HV.byId("actCrearFE")?.addEventListener("click", function () { if (!requireSel()) return; alert("Crear FE (por implementar)"); });
        HV.byId("actEnviarCorreo")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar correo (por implementar)"); });
        HV.byId("actPosAElectronica")?.addEventListener("click", function () { if (!requireSel()) return; alert("POS → Electrónica (por implementar)"); });
    });
})();
