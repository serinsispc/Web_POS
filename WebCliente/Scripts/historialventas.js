/* ======================================
   HISTORIAL VENTAS – LÓGICA DE FRONTEND
   (rango de fechas + filtros embebidos + modales + overflow "Más")
   v1.8.8
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
        var formaDePago = (it.formaDePago || it.FormaDePago || it.namePayment_method || it.namePayment_form || "").toString().trim();
        var estado = (it.estadoVenta || it.Estado || "").toString().trim();
        var nit = (it.nit || it.NIT || "").toString().trim();
        var cliente = (it.nombreCliente || it.Cliente || "").toString().trim();

        var cufeRaw = (it.cufe || it.CUFE || "--").toString().trim();
        var tipoMayus = tipo.toUpperCase();
        var cufeDisplay = "N/A", cufeStatus = "na";
        if (tipoMayus === "FACTURA ELECTRONICA DE VENTA" || tipoMayus === "FACTURA ELECTRÓNICA DE VENTA") {
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

        var idVenta = it.idVenta ?? it.id ?? it.Id ?? null;

        return {
            raw: it,
            idVenta: idVenta,
            fechaVenta: fecha,
            tipoFactura: tipo,
            prefijo: prefijo,
            numeroVenta: numero,
            total: totalVenta,
            formaDePago: formaDePago,
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

    // ===== Overflow/Responsive para tabla HV
    var overflowMode = false;
    var HIDDEN_COLS = ["nit", "nombreCliente", "cufe"];

    function ensureMoreHeader() {
        var theadRow = document.querySelector("#tablaHV thead tr");
        if (!theadRow) return;
        var hasMore = !!theadRow.querySelector('th[data-col="more"]');
        if (!hasMore) {
            var th = document.createElement("th");
            th.setAttribute("data-col", "more");
            th.className = "text-center";
            th.textContent = "Más";
            theadRow.appendChild(th);
        }
    }

    function setHeaderColumnsVisibility() {
        var ths = document.querySelectorAll("#tablaHV thead th");
        ths.forEach(function (th) {
            var col = th.getAttribute("data-col");
            if (!col) return;
            if (HIDDEN_COLS.includes(col)) {
                th.classList.toggle("d-none", overflowMode);
            } else if (col === "more") {
                th.classList.toggle("d-none", !overflowMode);
            }
        });
    }

    // Fuerza overflow por breakpoint (mejor UX) o si realmente se desborda
    function isTableOverflowing() {
        var container = document.querySelector("#tablaHV")?.closest(".table-responsive");
        if (!container) return false;
        var table = container.querySelector("table");
        if (!table) return false;

        var HYST = 40;
        var forceByWidth = container.clientWidth < 1260; // puedes ajustar este corte si quieres
        var realOverflow = table.scrollWidth > (container.clientWidth + HYST);

        return forceByWidth || realOverflow;
    }

    function visibleHeaderCount() {
        var ths = document.querySelectorAll("#tablaHV thead th");
        var count = 0;
        ths.forEach(function (th) { if (!th.classList.contains("d-none")) count++; });
        return count || ths.length || 1;
    }

    function buildDetailsHtml(x) {
        var cufeText = (x.cufeStatus === "aceptada" && x.cufeRaw && x.cufeRaw !== "--") ? x.cufeRaw : (x.cufe || "N/A");
        return (
            '<div class="hv-details-scroll">' +
            '<div class="hv-details-inline">' +
            '<span><span class="k">NIT:</span><span class="v">' + (x.nit || "--") + '</span></span>' +
            '<span><span class="k">Cliente:</span><span class="v">' + (x.nombreCliente || "--") + '</span></span>' +
            '<span><span class="k">CUFE:</span><span class="v">' + (cufeText || "N/A") + '</span></span>' +
            '</div>' +
            '</div>'
        );
    }

    // ===== Render tabla HV
    function renderTable() {
        // 1) medir overflow PRIMERO para ocultar columnas antes de pintar
        overflowMode = isTableOverflowing();

        ensureMoreHeader();
        setHeaderColumnsVisibility();

        var tbody = document.querySelector("#tablaHV tbody");
        if (!tbody) return;
        var frag = document.createDocumentFragment();

        filtered.forEach(function (x) {
            var tr = document.createElement("tr");
            if (selected && selected === x) tr.classList.add("row-selected");

            function td(content, cls, isNode, dataCol) {
                var el = document.createElement("td");
                if (cls) el.className = cls;
                if (dataCol) el.setAttribute("data-col", dataCol);
                if (isNode) el.appendChild(content); else el.textContent = content;
                tr.appendChild(el);
            }

            // visibles siempre
            td(formatDate(x.fechaVenta), "", false, "fechaVenta");
            td(x.tipoFactura || "", "", false, "tipoFactura");
            td(x.prefijo || "", "", false, "prefijo");
            td(String(x.numeroVenta || ""), "", false, "numeroVenta");
            td(fmtCOP.format(x.total || 0), "text-end", false, "total");
            td(x.formaDePago || "", "", false, "formaDePago");

            var est = document.createElement("span");
            est.className = "badge rounded-pill " + estadoClass(x.estadoVenta);
            est.textContent = x.estadoVenta || "--";
            td(est, "", true, "estadoVenta");

            if (!overflowMode) {
                td(x.nit || "", "", false, "nit");

                // Cliente con tooltip (nombre completo)
                (function () {
                    var txt = x.nombreCliente || "";
                    var el = document.createElement("span");
                    el.textContent = txt || "";
                    if (txt) {
                        el.setAttribute("title", txt);
                        el.setAttribute("data-bs-toggle", "tooltip");
                        el.setAttribute("data-bs-placement", "top");
                    }
                    td(el, "", true, "nombreCliente");
                })();

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
                td(badge, "", true, "cufe");
            } else {
                var btn = document.createElement("button");
                btn.type = "button";
                btn.className = "btn btn-more btn-sm";
                btn.title = "Mostrar más detalles";
                btn.innerHTML = '<i class="bi bi-three-dots"></i><span>Más</span>';
                btn.addEventListener("click", function (ev) {
                    ev.stopPropagation();
                    var detailsRow = tr.nextElementSibling;
                    if (!detailsRow || !detailsRow.classList.contains("row-details")) return;
                    detailsRow.classList.toggle("d-none");
                });
                var tdMore = document.createElement("td");
                tdMore.setAttribute("data-col", "more");
                tdMore.className = "text-center";
                tdMore.appendChild(btn);
                tr.appendChild(tdMore);
            }

            tr.addEventListener("click", function () { selectRow(x); });
            frag.appendChild(tr);

            if (overflowMode) {
                var trd = document.createElement("tr");
                trd.className = "row-details d-none";
                var tdd = document.createElement("td");
                tdd.colSpan = visibleHeaderCount();
                tdd.innerHTML = buildDetailsHtml(x);
                trd.appendChild(tdd);
                frag.appendChild(trd);
            }
        });

        while (tbody.firstChild) tbody.removeChild(tbody.firstChild);
        tbody.appendChild(frag);

        // Tooltips bootstrap (cliente truncado y cufe)
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
                var esFE = (x.tipoFactura || "").toUpperCase();
                esFE = (esFE === "FACTURA ELECTRONICA DE VENTA" || esFE === "FACTURA ELECTRÓNICA DE VENTA");
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

    // ===== Acciones (placeholders + export + resoluciones)
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

    // === Autocompletar rango de fechas y coherencia ===
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
    }

    // ====== RESOLUCIONES (Modal)
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
    function rango(desde, hasta) { if ((desde ?? "") === "" && (hasta ?? "") === "") return ""; return (desde ?? "") + " – " + (hasta ?? ""); }
    function estadoBadge(estado, estadoText) {
        var act = Number(estado) === 1 || (estadoText || "").toUpperCase().includes("ACTIV");
        var cls = act ? "bg-success" : "bg-secondary";
        var txt = estadoText || (act ? "ACTIVA" : "INACTIVA");
        return '<span class="badge ' + cls + '">' + txt + '</span>';
    }
    function btnSeleccionarResol(idResolucion, estado) {
        var disabled = (Number(estado) === 1) ? "" : "disabled";
        var id = (idResolucion ?? "").toString();
        return '<button type="button" class="btn btn-primary btn-sm btn-sel-resol" data-id="' + id + '" ' + disabled + '>Seleccionar</button>';
    }
    function llenarTablaResoluciones(lista) {
        var tbody = document.querySelector("#tabla-resoluciones tbody");
        var alerta = byId("alerta-sin-resoluciones");
        if (!tbody) return;

        tbody.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
            if (alerta) alerta.classList.remove("d-none");
            return;
        }
        if (alerta) alerta.classList.add("d-none");

        lista.forEach(function (raw, i) {
            var r = normalizarResolucion(raw);
            var tr = document.createElement("tr");
            tr.innerHTML = ''
                + '<td>' + (i + 1) + '</td>'
                + '<td>' + r.nombreResolucion + '</td>'
                + '<td>' + r.prefijo + '</td>'
                + '<td>' + r.numeroResolucion + '</td>'
                + '<td>' + (r.fechaHabilitacion || '') + '</td>'
                + '<td>' + (r.vigencia || '') + '</td>'
                + '<td>' + rango(r.desde, r.hasta) + '</td>'
                + '<td>' + r.consecutivo + ' <small class="text-muted">(' + r.consecutivoInicial + ' inicial)</small></td>'
                + '<td>' + estadoBadge(r.estado, r.estadoText) + '</td>'
                + '<td class="text-truncate" style="max-width:240px;" title="' + (r.technical_key || '') + '">' + (r.technical_key || '') + '</td>'
                + '<td class="text-end">' + btnSeleccionarResol(r.idResolucion, r.estado) + '</td>';
            tbody.appendChild(tr);
        });
    }
    function abrirModalResolucionesSiHayDatos() {
        var holder = byId("hv-resol");
        if (!holder) return;
        var jsonText = decodeBase64(holder.getAttribute("data-json") || "");
        var lista;
        try { lista = JSON.parse(jsonText) || []; } catch { lista = []; }

        llenarTablaResoluciones(lista);
        if (Array.isArray(lista) && lista.length > 0) {
            var modalEl = byId("modalResoluciones");
            if (modalEl && window.bootstrap && bootstrap.Modal) {
                var modal = new bootstrap.Modal(modalEl, { backdrop: "static" });
                modal.show();
            }
        }
    }
    function wireSeleccionResolucion() {
        document.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".btn-sel-resol"); if (!btn) return;
            var id = btn.getAttribute("data-id");
            if (!id) return;

            var inp = byId("inp-idResolucion");
            var form = byId("formSelResol");

            if (inp && form) {
                inp.value = id;

                var modalEl = byId("modalResoluciones");
                if (modalEl && window.bootstrap && bootstrap.Modal) {
                    var instance = bootstrap.Modal.getInstance(modalEl) || new bootstrap.Modal(modalEl);
                    instance.hide();
                }

                form.submit();
            }
        });
    }

    // ===== CLIENTES (Modal) =====
    function decodeB64ToJson(b64) { try { if (!b64) return null; var txt = atob(b64); return JSON.parse(txt); } catch (e) { return null; } }

    // Solo estos campos (y en este orden) llegan y se muestran
    function normalizarCliente(c) {
        return {
            id: c.id ?? c.idCliente ?? c.Id ?? 0,
            identificationNumber: (c.identificationNumber ?? "").toString(),
            nameCliente: (c.nameCliente ?? "").toString(),
            tradeName: (c.tradeName ?? "").toString(),
            phone: (c.phone ?? "").toString(),
            adress: (c.adress ?? "").toString(),
            email: (c.email ?? "").toString()
        };
    }

    function pintarTablaClientes(lista) {
        var tbody = document.querySelector("#tablaClientes tbody");
        if (!tbody) return;
        tbody.innerHTML = "";
        if (!Array.isArray(lista) || lista.length === 0) {
            var tr = document.createElement("tr");
            var td = document.createElement("td");
            td.colSpan = 7;
            td.className = "text-center text-muted";
            td.textContent = "No hay clientes para mostrar.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }
        function safe(v) { v = (v ?? "").toString().trim(); return v === "" ? "-" : v; }

        var frag = document.createDocumentFragment();
        lista.forEach(function (raw) {
            var c = normalizarCliente(raw);
            var tr = document.createElement("tr");
            tr.innerHTML =
                '<td>' + safe(c.identificationNumber) + '</td>' +
                '<td>' + safe(c.nameCliente) + '</td>' +
                '<td>' + safe(c.tradeName) + '</td>' +
                '<td>' + safe(c.phone) + '</td>' +
                '<td>' + safe(c.adress) + '</td>' +
                '<td>' + safe(c.email) + '</td>' +
                '<td class="text-center">' +
                '<button type="button" class="btn btn-primary btn-sm btn-sel-cliente" data-id="' + c.id + '">' +
                '<i class="bi bi-check2-circle me-1"></i>Seleccionar' +
                '</button>' +
                '</td>';
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
    }

    function filtrarClientes(lista, texto) {
        var q = (texto ?? "").toString().trim().toUpperCase();
        if (!q) return lista.slice();
        return lista.filter(function (raw) {
            var c = normalizarCliente(raw);
            var s = [
                c.identificationNumber, c.nameCliente, c.tradeName,
                c.phone, c.adress, c.email
            ].join(" | ").toUpperCase();
            return s.indexOf(q) >= 0;
        });
    }

    function wireModalClientes() {
        var modalClientesEl = byId("modalClientes");
        if (!modalClientesEl) return;

        var base64 = window.ClientesBase64 || "";
        var clientes = decodeB64ToJson(base64);
        if (!Array.isArray(clientes)) clientes = [];

        pintarTablaClientes(clientes);

        if (window.DebeMostrarModalClientes === true || window.DebeMostrarModalClientes === "true") {
            if (window.bootstrap && bootstrap.Modal) {
                var modalCli = new bootstrap.Modal(modalClientesEl, { backdrop: "static", keyboard: false });
                modalCli.show();
            }
        }

        byId("cliFiltroTexto")?.addEventListener("input", function () {
            var texto = this.value || "";
            var lista = filtrarClientes(clientes, texto);
            pintarTablaClientes(lista);
        });
        byId("cliBtnLimpiar")?.addEventListener("click", function () {
            var inp = byId("cliFiltroTexto");
            if (inp) { inp.value = ""; }
            pintarTablaClientes(clientes);
        });

        document.addEventListener("click", function (ev) {
            var btn = ev.target.closest(".btn-sel-cliente");
            if (!btn) return;
            var idCli = btn.getAttribute("data-id");
            if (!idCli) return;

            var hid = byId("idClienteSeleccionado");
            var form = byId("formSeleccionarCliente");
            if (hid && form) {
                hid.value = idCli;

                if (window.bootstrap && bootstrap.Modal) {
                    var inst = bootstrap.Modal.getInstance(modalClientesEl) || new bootstrap.Modal(modalClientesEl);
                    inst.hide();
                }

                form.submit();
            }
        });
    }

    // ===== Acciones de UI
    function hookActions() {
        var formNumero = byId("formNumero");

        // Rango fechas
        wireDateRange();

        // NUMERO: submit con Enter
        byId("fNumeroFactura")?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (formNumero) {
                    e.preventDefault();
                    if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit();
                    else formNumero.submit();
                }
            }
        });

        // Switches FE (cliente-side)
        byId("chkFEPendientes")?.addEventListener("change", applyFilters);
        byId("chkFacturaElectronica")?.addEventListener("change", applyFilters);

        // Exportar/Imprimir
        byId("btnExportar")?.addEventListener("click", exportCSV);
        byId("btnImprimir")?.addEventListener("click", imprimir);
        byId("actExportar")?.addEventListener("click", exportCSV);
        byId("actImprimir")?.addEventListener("click", imprimir);

        // Placeholders simples
        byId("actVerDetalle")?.addEventListener("click", function () { if (!requireSel()) return; alert("Ver detalle de " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? "")); });
        byId("actAnular")?.addEventListener("click", function () { if (!requireSel()) return; if (confirm("¿Anular la venta " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? "") + "?")) { console.log("Anular -> endpoint"); } });
        byId("actCrearFE")?.addEventListener("click", function () { if (!requireSel()) return; alert("Crear Factura Electrónica (placeholder)"); });
        byId("actEnviarCorreo")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar Factura por Correo (placeholder)"); });
        byId("actDevolucion")?.addEventListener("click", function () { if (!requireSel()) return; alert("Devolución (placeholder)"); });
        byId("actPosAElectronica")?.addEventListener("click", function () { if (!requireSel()) return; alert("POS a Electrónica (placeholder)"); });
        byId("actClonar")?.addEventListener("click", function () { if (!requireSel()) return; alert("Clonar Factura (placeholder)"); });
        byId("actAumentarNumero")?.addEventListener("click", function () { if (!requireSel()) return; alert("Aumentar Número (placeholder)"); });
        byId("actEnviarDIAN")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar a DIAN (placeholder)"); });
        byId("actDescargarFactura")?.addEventListener("click", function () { if (!requireSel()) return; alert("Descargar Factura (placeholder)"); });

        // Resolución -> POST a ListaResoluciones con idventa seleccionado
        byId("actResolucion")?.addEventListener("click", function () {
            if (!requireSel()) return;
            var form = byId("formResolucion");
            var input = byId("inputIdVenta");
            if (!form || !input) { alert("No se encontró el formulario de Resolución."); return; }
            var idv = selected.idVenta ?? (selected.raw ? (selected.raw.idVenta ?? selected.raw.id ?? selected.raw.Id ?? 0) : 0);
            if (!idv || idv <= 0) { alert("No se pudo determinar el id de la venta seleccionada."); return; }
            input.value = idv;
            form.submit();
        });

        // **Editar/Agregar Cliente** -> POST a BotonEditar_AgregarCliente con idventa
        byId("actEditarCliente")?.addEventListener("click", function () {
            if (!requireSel()) return;
            var form = byId("formListaClientes");
            var inp = byId("inp-idventa-cliente") || byId("actEditarCliente");
            if (!form || !inp) { alert("No se encontró el formulario para clientes."); return; }
            var idv = selected.idVenta ?? (selected.raw ? (selected.raw.idVenta ?? selected.raw.id ?? selected.raw.Id ?? 0) : 0);
            if (!idv || idv <= 0) { alert("No se pudo determinar el id de la venta seleccionada."); return; }
            inp.value = idv;
            form.submit();
        });

        // Selección de resolución (desde el modal)
        wireSeleccionResolucion();

        // Modal de clientes
        wireModalClientes();

        // Redibujar si cambia el ancho (activar/desactivar overflow)
        window.addEventListener("resize", function () {
            var now = isTableOverflowing();
            if (now !== overflowMode) {
                overflowMode = now;
                sortAndRender();
            }
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
        sortDir = -1;
        sortAndRender();

        abrirModalResolucionesSiHayDatos();
    });
})();
