/* hv.core.js
   Utilidades comunes + manejo de selección + formato + tokens
*/
(function () {
    "use strict";

    if (window.HV) return; // evitar doble carga

    // ---- Estado global y namespace ------------------------------------------------
    const HV = {
        version: "1.0.0",
        selected: null, // { idVenta, ... }
        flags: {
            MODAL_AUTOOPENED: false,
            ANULAR_BUSY: false
        },
        fmtCOP: new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }),
        bus: document, // EventTarget para despachar eventos custom
    };
    window.HV = HV;

    // ---- Helpers ------------------------------------------------------------------
    HV.byId = id => document.getElementById(id);
    HV.q = sel => document.querySelector(sel);
    HV.qAll = sel => Array.prototype.slice.call(document.querySelectorAll(sel));

    HV.getAntiForgeryToken = function () {
        return document.querySelector('input[name="__RequestVerificationToken"]')?.value || "";
    };

    HV.showSwal = function (title, text, icon) {
        if (window.Swal && typeof window.Swal.fire === "function") {
            return Swal.fire({
                icon: icon || "info",
                title: title || "Aviso",
                text: text || "",
                confirmButtonText: "Continuar",
                allowOutsideClick: false,
                allowEscapeKey: true
            });
        } else {
            alert((title ? title + ": " : "") + (text || ""));
            return Promise.resolve();
        }
    };

    HV.ymd = d => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0');

    // Base64 -> UTF8 seguro
    HV.b64ToUtf8 = function (b64) {
        try {
            if (!b64) return "";
            const bin = atob(b64);
            if (window.TextDecoder) {
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new TextDecoder('utf-8').decode(bytes);
            } else {
                return decodeURIComponent(escape(bin));
            }
        } catch { return ""; }
    };
    HV.decodeB64ToJson = function (b64) {
        try {
            const txt = HV.b64ToUtf8(b64);
            return txt ? JSON.parse(txt) : null;
        } catch { return null; }
    };

    // Normaliza número desde string con separadores
    HV.normNum = function (v) {
        if (v == null) return "";
        let s = String(v).trim().replace(/[^\d.,-]/g, "");
        if (s.includes(".") && s.includes(",")) s = s.replace(/\./g, "").replace(",", ".");
        else if (!s.includes(".") && s.includes(",")) s = s.replace(",", ".");
        else if (s.includes(".") && !s.includes(",")) s = s.replace(/\./g, "");
        return s;
    };

    // ---- Lectura de la fila seleccionada -----------------------------------------
    function moneyToNumber(txt) {
        if (!txt) return 0;
        var s = String(txt).replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    }
    function parseDateSafe(val) {
        var d = val ? new Date(val) : null;
        return (d && !isNaN(d)) ? d : null;
    }
    function leerItemDesdeFila(tr) {
        function get(colName, idx) {
            var el = tr.querySelector('td[data-col="' + colName + '"]');
            if (el) return (el.textContent || "").trim();
            var td = tr.cells[idx];
            return td ? (td.textContent || "").trim() : "";
        }
        var idVenta = Number(tr.getAttribute("data-idventa") || "0");
        var prefijo = tr.getAttribute("data-prefijo") || "";
        var numeroLbl = get("numeroVenta", 0);
        var numeroRaw = tr.getAttribute("data-numero") || numeroLbl;
        var numeroSolo = (numeroRaw || "").toString().replace(/[^\d]/g, "");
        var fechaIso = tr.getAttribute("data-fecha") || "";
        var fechaTexto = get("fechaVenta", 1);
        var fechaVenta = parseDateSafe(fechaIso || (fechaTexto ? fechaTexto.replace(" ", "T") : ""));
        var totalTexto = get("total", 3);
        var totalData = Number(tr.getAttribute("data-total") || "0");
        var total = totalData || moneyToNumber(totalTexto);

        return {
            idVenta: idVenta,
            prefijo: prefijo,
            numeroVenta: numeroSolo || numeroRaw,
            numeroLabel: (prefijo ? (prefijo + " ") : "") + (numeroRaw || numeroSolo),
            fechaVenta: fechaVenta,
            fechaTexto: fechaTexto,
            tipoFactura: get("tipoFactura", 2),
            total: total,
            totalTexto: totalTexto,
            formaDePago: get("formaDePago", 4),
            medioDePago: get("medioDePago", 5),
            estadoVenta: get("estadoVenta", 6),
            nit: get("nit", 7),
            nombreCliente: get("nombreCliente", 8),
            estadoFE: get("estadoFE", 9),
            _attrs: { data_fecha_iso: fechaIso, data_total_num: totalData }
        };
    }
    HV.leerItemDesdeFila = leerItemDesdeFila;

    // ---- Selección de fila + actualización de panel --------------------------------
    HV.updateSidePanel = function () {
        const hasSel = !!HV.selected;
        const setEnabled = (id, en) => { const b = HV.byId(id); if (b) b.disabled = !en; };
        [
            "actImprimir", "actVerDetalle", "actAnular", "actCrearFE", "actEnviarCorreo",
            "actEditarCliente", "actDevolucion", "actPosAElectronica", "actClonar",
            "actExportar", "actResolucion", "actAumentarNumero", "actEnviarDIAN",
            "actDescargarFactura", "actEditarFecha", "actMediosDePago"
        ].forEach(id => {
            const allowAlways = (id === "actExportar" || id === "actImprimir");
            setEnabled(id, hasSel || allowAlways);
        });

        const lbl = HV.byId("lblTotalSeleccion");
        if (lbl) lbl.textContent = hasSel ? HV.fmtCOP.format(Number(HV.selected.total || 0)) : "$ 0";

        const fechaFact = HV.byId("fFechaFacturacion");
        if (fechaFact) {
            const f = HV.selected && HV.selected.fechaVenta ? HV.selected.fechaVenta : null;
            fechaFact.value = f ? HV.ymd(f) : "";
        }
    };

    HV.wireRowSelection = function () {
        const tbody = document.querySelector("#tablaHV tbody");
        if (!tbody) return;

        function clearPrev() { HV.qAll("#tablaHV tbody tr.row-selected").forEach(r => r.classList.remove("row-selected")); }

        document.addEventListener("click", function (ev) {
            const tr = ev.target.closest('#tablaHV tbody tr');
            if (!tr) return;

            clearPrev();
            tr.classList.add("row-selected");
            HV.selected = leerItemDesdeFila(tr);

            // sincroniza hidden usado en Anular
            const hid = HV.byId('idventa_anular');
            if (hid) hid.value = tr.getAttribute('data-idventa') || '';

            HV.updateSidePanel();
            try {
                HV.bus.dispatchEvent(new CustomEvent('venta:cambio-seleccion', { detail: { venta: HV.selected } }));
            } catch { /* no-op */ }
        }, false);
    };

    // Getter global
    window.getVentaSeleccionada = function (asJson) {
        if (!HV.selected) return null;
        const clone = JSON.parse(JSON.stringify(HV.selected));
        return asJson ? JSON.stringify(clone) : clone;
    };

})();
