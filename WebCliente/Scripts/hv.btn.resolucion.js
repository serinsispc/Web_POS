/* hv.btn.resolucion.js */
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    function rango(desde, hasta) { if ((desde ?? "") === "" && (hasta ?? "") === "") return ""; return (desde ?? "") + " – " + (hasta ?? ""); }
    function estadoBadge(estado, estadoText) {
        const act = Number(estado) === 1 || (String(estadoText || "").toUpperCase().includes("ACTIV"));
        const cls = act ? "bg-success" : "bg-secondary";
        const txt = estadoText || (act ? "ACTIVA" : "INACTIVA");
        return '<span class="badge ' + cls + '">' + txt + '</span>';
    }
    function normalizarResolucion(r) {
        return {
            id: r.id ?? null,
            nombreResolucion: r.nombreResolucion ?? r.nombreRosolucion ?? r.nombre_rosolucion ?? "",
            prefijo: r.prefijo ?? "",
            idResolucion: r.idResolucion ?? null,
            numeroResolucion: r.numeroResolucion ?? r.numero_resolucion ?? "",
            fechaHabilitacion: r.fechaHabilitacion ?? r.fechaAvilitacion ?? r.fecha_habilitacion ?? "",
            vigencia: r.vigencia ?? "",
            desde: r.desde ?? "",
            hasta: r.hasta ?? "",
            caja: r.caja ?? "",
            consecutivoInicial: r.consecutivoInicial ?? 0,
            consecutivo: r.consecutivo ?? 0,
            estado: r.estado ?? 0,
            estadoText: r.estadoText ?? r.estado_text ?? "",
            technical_key: r.technical_key ?? r.llave_tecnica ?? ""
        };
    }

    function llenarTablaResoluciones(lista) {
        const tbody = document.querySelector("#tabla-resoluciones tbody");
        const alerta = HV.byId("alerta-sin-resoluciones");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!Array.isArray(lista) || lista.length === 0) {
            if (alerta) alerta.classList.remove("d-none");
            return;
        }
        if (alerta) alerta.classList.add("d-none");

        lista.forEach(function (raw, i) {
            const r = normalizarResolucion(raw);
            const tr = document.createElement("tr");
            tr.innerHTML = ''
                + '<td>' + (i + 1) + '</td>'
                + '<td>' + r.nombreResolucion + '</td>'
                + '<td>' + r.prefijo + '</td>'
                + '<td>' + r.numeroResolucion + '</td>'
                + '<td>' + (r.fechaHabilitacion || '') + '</td>'
                + '<td>' + (r.vigencia || '') + '</td>'
                + '<td>' + rango(r.desde, r.hasta) + '</td>'
                + '<td>' + (r.consecutivo ?? 0) + ' <small class="text-muted">(' + (r.consecutivoInicial ?? 0) + ' inicial)</small></td>'
                + '<td>' + estadoBadge(r.estado, r.estadoText) + '</td>'
                + '<td class="text-truncate" style="max-width:240px;" title="' + (r.technical_key || '') + '">' + (r.technical_key || '') + '</td>'
                + '<td class="text-end">'
                + '<button type="button" class="btn btn-primary btn-sm btn-sel-resol" data-id="' + (r.idResolucion ?? '') + '" ' + ((Number(r.estado) === 1) ? '' : 'disabled') + '>Seleccionar</button>'
                + '</td>';
            tbody.appendChild(tr);
        });
    }

    function abrirModalResolucionesSiHayDatos() {
        const holder = HV.byId("hv-resol");
        if (!holder) return;
        const jsonText = HV.b64ToUtf8(holder.getAttribute("data-json") || "");
        let lista;
        try { lista = JSON.parse(jsonText) || []; } catch { lista = []; }
        llenarTablaResoluciones(lista);
        if (Array.isArray(lista) && lista.length > 0 && !HV.flags.MODAL_AUTOOPENED) {
            HV.Modals.show(HV.byId("modalResoluciones"), { backdrop: "static" });
            HV.flags.MODAL_AUTOOPENED = true;
        }
    }

    function wireSeleccionResolucion() {
        document.addEventListener("click", function (ev) {
            const btn = ev.target.closest(".btn-sel-resol"); if (!btn) return;
            const id = btn.getAttribute("data-id"); if (!id) return;

            const inp = HV.byId("inp-idResolucion");
            const form = HV.byId("formSelResol");
            const modalEl = HV.byId("modalResoluciones");

            if (inp && form) {
                inp.value = id;
                if (modalEl) HV.Modals.hide(modalEl);
                form.submit();
            }
        });
    }

    // Wire + botón que abre flujo resoluciones
    document.addEventListener("DOMContentLoaded", function () {
        abrirModalResolucionesSiHayDatos();
        wireSeleccionResolucion();

        const btn = HV.byId("actResolucion");
        if (btn) {
            btn.addEventListener("click", function () {
                if (!HV.selected || !HV.selected.idVenta) { alert("Selecciona una venta primero."); return; }
                const form = HV.byId("formResolucion");
                const input = HV.byId("inputIdVenta");
                if (!form || !input) { alert("No se encontró el formulario de Resolución."); return; }
                input.value = HV.selected.idVenta;
                form.submit();
            });
        }
    });

})();
