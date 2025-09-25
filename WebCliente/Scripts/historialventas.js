/* ======================================
   HISTORIAL VENTAS – LÓGICA DE FRONTEND
   (rango de fechas + filtros embebidos)
   v1.6.5
   ====================================== */
(function () {
    "use strict";

    // ===== Utils
    var fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    function parseDate(val) { var d = val ? new Date(val) : null; return isNaN(d) ? null : d; }
    function formatDate(d) {
        if (!d) return "";
        var yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, "0"),
            dd = String(d.getDate()).padStart(2, "0"), hh = String(d.getHours()).padStart(2, "0"),
            mi = String(d.getMinutes()).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
    }
    function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'); }
    function byId(id) { return document.getElementById(id); }
    function decodeBase64(b64) { try { return atob(b64 || ""); } catch { return "[]"; } }
    function normalizeText(v) { return (v ?? "").toString().trim().toUpperCase(); }

    // ===== Modelo
    function extractArrayFromModel(obj) {
        if (Array.isArray(obj)) return obj;
        if (obj && Array.isArray(obj.V_TablaVentas)) return obj.V_TablaVentas;
        if (obj && Array.isArray(obj.v_tabla_ventas)) return obj.v_tabla_ventas;
        if (obj && Array.isArray(obj.data)) return obj.data;
        if (obj && Array.isArray(obj.ventas)) return obj.ventas;
        return [];
    }

    var data = [], filtered = [], sortCol = null, sortDir = 1, selected = null;

    function normalizaItem(it) {
        var fecha = parseDate(it.fechaVenta || it.Fecha || it.fecha || it.FechaEmision) || null;
        var tipo = (it.tipoFactura || it.Tipo || "").toString().trim();
        var prefijo = (it.prefijo || it.Prefijo || "").toString().trim();
        var numero = it.numeroVenta ?? it.number ?? it.Numero ?? it.numero ?? "";
        var totalVenta = Number(it.totalVenta ?? it.totalFactura ?? it.Total ?? 0) || 0;
        var formaPago = (it.formaDePago || it.FormaDePago || it.namePayment_method || it.namePayment_form || "").toString().trim();
        var estado = (it.estadoVenta || it.Estado || "").toString().trim();
        var nit = (it.nit || it.NIT || "").toString().trim();
        var cliente = (it.nombreCliente || it.Cliente || "").toString().trim();

        var cufeRaw = (it.cufe || it.CUFE || "--").toString().trim();
        var tipoMayus = tipo.toUpperCase();
        var cufeDisplay = "N/A", cufeStatus = "na";
        if (tipoMayus === "FACTURA ELECTRONICA DE VENTA") {
            if (cufeRaw && cufeRaw !== "--") { cufeDisplay = "Factura aceptada"; cufeStatus = "aceptada"; }
            else { cufeDisplay = "Factura rechazada"; cufeStatus = "rechazada"; }
        }

        var consecutivo = (prefijo ? prefijo + "-" : "") + (numero || "");

        var subtotal = Number(it.subtotalVenta || it.Subtotal || it.totalBase || 0) || 0;
        var impuestos = 0;
        impuestos += Number(it.IVA || it.iva || it.ivaVenta || it.totalImpuestos || 0) || 0;
        impuestos += Number(it.INC || it.inc || 0) || 0;
        impuestos += Number(it.INCBolsas || it.incBolsas || 0) || 0;

        var propina = Number(it.propina ?? it.propinaVenta ?? 0) || 0;

        return {
            raw: it,
            fechaVenta: fecha,
            tipoFactura: tipo,
            prefijo: prefijo,
            numeroVenta: numero,
            total: totalVenta,
            formaDePago: formaPago,
            estadoVenta: estado,
            nit: nit,
            nombreCliente: cliente,
            cufe: cufeDisplay,
            cufeStatus: cufeStatus,
            cufeRaw: cufeRaw,
            consecutivo: consecutivo,
            subtotal: subtotal,
            impuestos: impuestos,
            propina: propina
        };
    }

    // ===== helpers visuales
    function estadoClass(estado) {
        var s = (estado || "").toString().trim().toUpperCase();
        if (!s || s === "--") return "bg-secondary";
        if (["PAGADO", "PAGADA", "CANCELADO", "CANCELADA", "ACEPTADA", "ACEPTADO"].includes(s)) return "bg-success";
        if (["PENDIENTE", "EN PROCESO", "POR COBRAR"].includes(s)) return "bg-warning text-dark";
        if (["ANULADO", "ANULADA", "RECHAZADO", "RECHAZADA", "ERROR"].includes(s)) return "bg-danger";
        return "bg-secondary";
    }

    // ===== Render
    function renderTable() {
        var tbody = document.querySelector("#tablaHV tbody");
        if (!tbody) return;
        var frag = document.createDocumentFragment();

        filtered.forEach(function (x) {
            var tr = document.createElement("tr");
            if (selected && selected === x) tr.classList.add("row-selected");

            function td(content, cls, isNode) {
                var el = document.createElement("td");
                if (cls) el.className = cls;
                if (isNode) el.appendChild(content);
                else el.textContent = content;
                tr.appendChild(el);
            }

            td(formatDate(x.fechaVenta));
            td(x.tipoFactura || "");
            td(x.prefijo || "");
            td(String(x.numeroVenta || ""));
            td(fmtCOP.format(x.total || 0), "text-end");
            td(x.formaDePago || "");

            var est = document.createElement("span");
            est.className = "badge rounded-pill " + estadoClass(x.estadoVenta);
            est.textContent = x.estadoVenta || "--";
            td(est, "", true);

            td(x.nit || "");
            td(x.nombreCliente || "");

            var badge = document.createElement("span");
            var cls = "badge rounded-pill ";
            if (x.cufeStatus === "aceptada") cls += "bg-success";
            else if (x.cufeStatus === "rechazada") cls += "bg-danger";
            else cls += "bg-secondary";
            badge.className = cls;
            badge.textContent = x.cufe || "N/A";
            if (x.cufeStatus === "aceptada" && x.cufeRaw && x.cufeRaw !== "--") {
                badge.setAttribute("data-bs-toggle", "tooltip");
                badge.setAttribute("data-bs-placement", "top");
                badge.setAttribute("title", x.cufeRaw);
            }
            td(badge, "", true);

            tr.addEventListener("click", function () { selectRow(x); });
            frag.appendChild(tr);
        });

        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        tbody.appendChild(frag);

        if (window.bootstrap && typeof bootstrap.Tooltip === "function") {
            var triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(function (el) { new bootstrap.Tooltip(el); });
        }

        var resumen = byId("resumenHV");
        if (resumen) resumen.textContent = (filtered.length || 0) + " ventas";
    }

    function renderTotals() {
        var totSub = 0, totImp = 0, tot = 0, totProp = 0;
        for (var i = 0; i < filtered.length; i++) {
            totSub += filtered[i].subtotal || 0;
            totImp += filtered[i].impuestos || 0;
            tot += filtered[i].total || 0;
            totProp += filtered[i].propina || 0;
        }
        var el = byId("totalesHV");
        if (el) {
            var txt = "Subtotal: " + fmtCOP.format(totSub) + "  |  Impuestos: " + fmtCOP.format(totImp) + "  |  Total: " + fmtCOP.format(tot);
            if (totProp > 0) txt += "  |  Propina: " + fmtCOP.format(totProp);
            el.textContent = txt;
        }
    }

    function sortAndRender() {
        if (sortCol) {
            filtered.sort(function (a, b) {
                var va = a[sortCol], vb = b[sortCol];
                if (va === vb) return 0;
                if (va == null) return -1 * sortDir;
                if (vb == null) return 1 * sortDir;
                if (va > vb) return 1 * sortDir;
                return -1 * sortDir;
            });
        }
        renderTable(); renderTotals(); updateSidePanel();
    }

    // ===== Filtros (cliente-side)
    function trueish(obj, keys) {
        for (var i = 0; i < keys.length; i++) {
            var v = obj[keys[i]];
            if (typeof v === "string") {
                var s = v.toUpperCase();
                if (s === "1" || s === "TRUE" || s === "SI" || s === "SÍ" || s === "PENDIENTE") return true;
            } else if (typeof v === "number") {
                if (v === 1) return true;
            } else if (typeof v === "boolean") {
                if (v) return true;
            }
        }
        return false;
    }

    function endOfDay(d) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }

    function applyFilters() {
        var numFac = normalizeText(byId("fNumeroFactura")?.value || "");
        var clienteTxt = normalizeText(byId("fClienteTexto")?.value || "");
        var fePend = byId("chkFEPendientes")?.checked;
        var feOnly = byId("chkFacturaElectronica")?.checked;

        var dDesde = byId("fFechaDesde")?.value ? new Date(byId("fFechaDesde").value + "T00:00:00") : null;
        var dHasta = byId("fFechaHasta")?.value ? endOfDay(new Date(byId("fFechaHasta").value + "T00:00:00")) : null;

        filtered = data.filter(function (x) {
            var r = x.raw || {};

            if (x.fechaVenta) {
                if (dDesde && x.fechaVenta < dDesde) return false;
                if (dHasta && x.fechaVenta > dHasta) return false;
            } else {
                if (dDesde || dHasta) return false;
            }

            if (numFac) {
                var c = normalizeText(x.consecutivo);
                var nRaw = normalizeText(r.numeroVenta ?? r.number ?? r.Numero ?? r.numero ?? "");
                if (c.indexOf(numFac) < 0 && nRaw.indexOf(numFac) < 0) return false;
            }

            if (clienteTxt) {
                var nombres = normalizeText(r.nombreCliente ?? r.Cliente ?? "");
                var nit = normalizeText(r.nit ?? r.NIT ?? "");
                if (nombres.indexOf(clienteTxt) < 0 && nit.indexOf(clienteTxt) < 0) return false;
            }

            if (fePend) {
                var ok = trueish(r, ["FEPendiente", "fePendiente", "FE_Pendiente", "estadoFE", "estado_factura_electronica"]);
                if (!ok) return false;
            }
            if (feOnly) {
                var esFE = (x.tipoFactura || "").toUpperCase() === "FACTURA ELECTRONICA DE VENTA";
                if (!esFE) return false;
            }

            return true;
        });

        if (selected && filtered.indexOf(selected) < 0) selected = null;
        sortAndRender();
    }

    // ===== Selección y panel lateral
    function selectRow(item) { selected = item; renderTable(); updateSidePanel(); }
    function setEnabled(id, en) { var b = byId(id); if (b) b.disabled = !en; }
    function updateSidePanel() {
        var hasSel = !!selected;
        [
            "actImprimir", "actVerDetalle", "actAnular", "actCrearFE", "actEnviarCorreo",
            "actEditarCliente", "actDevolucion", "actPosAElectronica", "actClonar",
            "actExportar", "actResolucion", "actAumentarNumero", "actEnviarDIAN", "actDescargarFactura",
            "actEditarFecha"
        ].forEach(function (id) { setEnabled(id, hasSel || id === "actExportar" || id === "actImprimir"); });

        var lbl = byId("lblTotalSeleccion");
        if (lbl) lbl.textContent = hasSel ? fmtCOP.format(selected.total || 0) : "$ 0";

        var fechaFact = byId("fFechaFacturacion");
        if (fechaFact) fechaFact.value = hasSel && selected.fechaVenta ? ymd(selected.fechaVenta) : "";
    }

    // ===== Acciones (placeholders + export)
    function requireSel() { if (!selected) { alert("Selecciona una venta primero."); return false; } return true; }
    function exportCSV() {
        if (!filtered.length) { alert("No hay datos para exportar."); return; }
        var sep = ";";
        var headers = ["Fecha", "Tipo", "Prefijo", "Número", "Total", "Forma de Pago", "Estado", "NIT", "Cliente", "CUFE"];
        var rows = [headers.join(sep)];
        filtered.forEach(function (x) {
            rows.push([
                formatDate(x.fechaVenta), x.tipoFactura || "", x.prefijo || "",
                String(x.numeroVenta || ""), String(x.total || 0).replace(/\./g, ","),
                x.formaDePago || "", x.estadoVenta || "", x.nit || "", x.nombreCliente || "",
                x.cufe || "N/A"
            ].join(sep));
        });
        var csv = rows.join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        var hoy = new Date(), stamp = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
        a.download = "historial_ventas_" + stamp + ".csv"; a.click(); URL.revokeObjectURL(url);
    }
    function imprimir() { window.print(); }

    // === Autocompletar rango de fechas y mantener coherencia ===
    function wireDateRange() {
        var desde = byId('fFechaDesde');
        var hasta = byId('fFechaHasta');
        if (!desde || !hasta) return;

        function syncMinMax() {
            if (desde.value) { hasta.min = desde.value; } else { hasta.removeAttribute('min'); }
            if (hasta.value) { desde.max = hasta.value; } else { desde.removeAttribute('max'); }
        }
        desde.addEventListener('change', function () {
            if (!hasta.value && desde.value) hasta.value = desde.value;
            if (hasta.value && desde.value && new Date(hasta.value) < new Date(desde.value)) {
                hasta.value = desde.value;
            }
            syncMinMax();
        });
        hasta.addEventListener('change', function () {
            if (!desde.value && hasta.value) desde.value = hasta.value;
            if (hasta.value && desde.value && new Date(desde.value) > new Date(hasta.value)) {
                desde.value = hasta.value;
            }
            syncMinMax();
        });
        syncMinMax();
    }

    // === Prellenar desde el JSON de sesión ===
    function setDateInput(id, iso) {
        if (!iso) return;
        var el = byId(id);
        if (!el) return;
        var d = new Date(iso);
        if (isNaN(d)) return;
        el.value = ymd(d);
    }
    function setTextInput(id, val) {
        if (val == null || val === "") return;
        var el = byId(id); if (!el) return;
        el.value = val;
    }
    function prefillFromSession(root) {
        setDateInput('fFechaDesde', root.Fecha1 || root.fecha1);
        setDateInput('fFechaHasta', root.Fecha2 || root.fecha2);
        setTextInput('fClienteTexto', root.NombreCliente || root.nombreCliente);
        // setTextInput('fNumeroFactura', root.NumeroFactura || root.numeroFactura); // si quieres precargar
    }

    // ===== Listeners y arranque
    function hookActions() {
        var formFechas = byId("formFechas");
        var formNumero = byId("formNumero");
        var formCliente = byId("formCliente");

        // Rango fechas
        wireDateRange();

        // === NUMERO: submit al servidor
        // (el botón ya es type="submit"; esto asegura Enter también)
        byId("fNumeroFactura")?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                // deja que el form se envíe de forma natural
                // (si algún navegador no envía, forzamos)
                if (formNumero) {
                    e.preventDefault();
                    if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit();
                    else formNumero.submit();
                }
            }
        });

        // === CLIENTE: antes de enviar, sincronizar fechas ocultas con lo visible
        if (formCliente) {
            formCliente.addEventListener("submit", function () {
                var f1 = byId("fFechaDesde")?.value || "";
                var f2 = byId("fFechaHasta")?.value || "";
                var h1 = byId("hFecha1"), h2 = byId("hFecha2");
                if (h1 && f1) h1.value = f1;
                if (h2 && f2) h2.value = f2;
            });
        }

        // Switches FE (cliente-side)
        byId("chkFEPendientes")?.addEventListener("change", applyFilters);
        byId("chkFacturaElectronica")?.addEventListener("change", applyFilters);

        // Enter en CLIENTE sin JS adicional (submit natural del form)

        // Exportar/Imprimir
        byId("btnExportar")?.addEventListener("click", exportCSV);
        byId("btnImprimir")?.addEventListener("click", imprimir);

        // Panel lateral
        byId("actExportar")?.addEventListener("click", exportCSV);
        byId("actImprimir")?.addEventListener("click", imprimir);

        byId("actVerDetalle")?.addEventListener("click", function () { if (!requireSel()) return; alert("Ver detalle de " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? "")); });
        byId("actAnular")?.addEventListener("click", function () { if (!requireSel()) return; if (confirm("¿Anular la venta " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? "") + "?")) { console.log("Anular -> endpoint"); } });
        byId("actCrearFE")?.addEventListener("click", function () { if (!requireSel()) return; alert("Crear Factura Electrónica (placeholder)"); });
        byId("actEnviarCorreo")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar Factura por Correo (placeholder)"); });
        byId("actEditarCliente")?.addEventListener("click", function () { if (!requireSel()) return; alert("Editar/Agregar cliente para " + (selected.nombreCliente || "cliente")); });
        byId("actDevolucion")?.addEventListener("click", function () { if (!requireSel()) return; alert("Devolución (placeholder)"); });
        byId("actPosAElectronica")?.addEventListener("click", function () { if (!requireSel()) return; alert("POS a Electrónica (placeholder)"); });
        byId("actClonar")?.addEventListener("click", function () { if (!requireSel()) return; alert("Clonar Factura (placeholder)"); });
        byId("actResolucion")?.addEventListener("click", function () { if (!requireSel()) return; alert("Resolución (placeholder)"); });
        byId("actAumentarNumero")?.addEventListener("click", function () { if (!requireSel()) return; alert("Aumentar Número (placeholder)"); });
        byId("actEnviarDIAN")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar a DIAN (placeholder)"); });
        byId("actDescargarFactura")?.addEventListener("click", function () { if (!requireSel()) return; alert("Descargar Factura (placeholder)"); });

        // Sort headers
        var thead = document.querySelector("#tablaHV thead");
        if (thead) thead.addEventListener("click", function (ev) {
            var th = ev.target.closest("th"); if (!th) return;
            var col = th.getAttribute("data-col"); if (!col) return;
            if (sortCol === col) sortDir = -sortDir; else { sortCol = col; sortDir = 1; }
            sortAndRender();
        });
    }

    // ===== INIT
    document.addEventListener("DOMContentLoaded", function () {
        var holder = byId("hv-data"); if (!holder) return;

        var jsonText = decodeBase64(holder.getAttribute("data-json") || "");
        var root = {};
        try { root = JSON.parse(jsonText) || {}; } catch (e) { root = {}; }

        var raw = extractArrayFromModel(root);
        data = raw.map(normalizaItem);
        filtered = data.slice();

        prefillFromSession(root);

        hookActions();
        sortCol = "fechaVenta";
        sortDir = -1; // recientes primero

        // applyFilters(); // <- si quieres aplicar en cliente al cargar
        sortAndRender();
    });
})();
