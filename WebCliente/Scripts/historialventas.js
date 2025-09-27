//    archivo    historialventas.js
/* ======================================
   HISTORIAL VENTAS – LÓGICA DE FRONTEND (sin render de filas)
   v1.9.0
   --------------------------------------
   - La tabla (#tablaHV) viene renderizada desde Razor/ASP.
   - Este JS NO crea filas ni columnas.
   - Funciones activas: selección de fila, envío de formularios, rango de fechas,
     exportar CSV desde DOM, impresión, modales de resoluciones y clientes.
   ====================================== */
(function () {
    "use strict";

    // ===== Utils
    var fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    function byId(id) { return document.getElementById(id); }
    function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'); }
    function parseDate(val) { var d = val ? new Date(val) : null; return isNaN(d) ? null : d; }
    function formatDate(d) {
        if (!d) return "";
        var yyyy = d.getFullYear(), mm = String(d.getMonth() + 1).padStart(2, "0"),
            dd = String(d.getDate()).padStart(2, "0"), hh = String(d.getHours()).padStart(2, "0"),
            mi = String(d.getMinutes()).padStart(2, "0");
        return yyyy + "-" + mm + "-" + dd + " " + hh + ":" + mi;
    }
    function decodeBase64(b64) { try { return atob(b64 || ""); } catch { return "[]"; } }

    // ===== Estado de la UI (ya no hay 'data/filtered')
    var selected = null; // { idVenta, total, fechaVenta, prefijo, numeroVenta, ... } (lo que se pueda leer del DOM)

    // ===== Selección y panel lateral
    function setEnabled(id, en) { var b = byId(id); if (b) b.disabled = !en; }
    function updateSidePanel() {
        var hasSel = !!selected;
        [
            "actImprimir", "actVerDetalle", "actAnular", "actCrearFE", "actEnviarCorreo",
            "actEditarCliente", "actDevolucion", "actPosAElectronica", "actClonar",
            "actExportar", "actResolucion", "actAumentarNumero", "actEnviarDIAN", "actDescargarFactura",
            "actEditarFecha"
        ].forEach(function (id) {
            // Exportar/Imprimir pueden estar siempre activos si lo prefieres
            var allowAlways = (id === "actExportar" || id === "actImprimir");
            setEnabled(id, hasSel || allowAlways);
        });

        var lbl = byId("lblTotalSeleccion");
        if (lbl) lbl.textContent = hasSel ? fmtCOP.format(Number(selected.total || 0)) : "$ 0";

        var fechaFact = byId("fFechaFacturacion");
        if (fechaFact) {
            var f = selected && selected.fechaVenta ? selected.fechaVenta : null;
            fechaFact.value = f ? ymd(f) : "";
        }
    }

    function leerItemDesdeFila(tr) {
        // Recomendado: imprimir estos data-attrs en Razor
        // <tr data-idventa="@x.id" data-total="@x.total" data-fecha="@x.fechaVentaIso" data-prefijo="@x.prefijo" data-numero="@x.numeroVenta">
        var idv = Number(tr.getAttribute("data-idventa") || "0");
        var total = Number(tr.getAttribute("data-total") || "0");
        var fechaIso = tr.getAttribute("data-fecha") || "";
        var fecha = parseDate(fechaIso);

        // Intento de respaldo (si no tienes data-attrs): lee celdas por orden.
        // Ajusta índices a tu orden real si lo necesitas.
        if (!idv) {
            // Si hay un input oculto por fila con id, podrías leerlo aquí.
        }
        if (!total) {
            var totalCell = tr.querySelector('td[data-col="total"]') || tr.cells[4]; // 0:fecha,1:tipo,2:prefijo,3:num,4:total,...
            if (totalCell) {
                var t = (totalCell.textContent || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
                total = Number(t) || 0;
            }
        }
        if (!fecha) {
            var fCell = tr.querySelector('td[data-col="fechaVenta"]') || tr.cells[0];
            var txt = (fCell ? fCell.textContent : "").trim();
            var guess = parseDate(txt.replace(" ", "T"));
            fecha = isNaN(guess) ? null : guess;
        }

        // Prefijo y número (si los necesitas para mensajes)
        var pref = tr.getAttribute("data-prefijo") || (tr.querySelector('td[data-col="prefijo"]')?.textContent || "").trim();
        var num = tr.getAttribute("data-numero") || (tr.querySelector('td[data-col="numeroVenta"]')?.textContent || "").trim();

        return {
            idVenta: idv,
            total: total,
            fechaVenta: fecha,
            prefijo: pref,
            numeroVenta: num
        };
    }

    function clearRowSelection(tbody) {
        if (!tbody) return;
        var prev = tbody.querySelectorAll("tr.row-selected");
        prev.forEach(function (r) { r.classList.remove("row-selected"); });
    }

    function wireRowSelection() {
        var tbody = document.querySelector("#tablaHV tbody");
        if (!tbody) return;

        tbody.addEventListener("click", function (ev) {
            var tr = ev.target.closest("tr");
            if (!tr || !tbody.contains(tr)) return;

            // Evita capturar clicks en filas de "detalles" si existieran
            if (tr.classList.contains("row-details")) return;

            selected = leerItemDesdeFila(tr);
            clearRowSelection(tbody);
            tr.classList.add("row-selected");
            updateSidePanel();
        });
    }

    // ===== Acciones (placeholders + export + resoluciones)
    function requireSel() { if (!selected || !selected.idVenta) { alert("Selecciona una venta primero."); return false; } return true; }

    function exportCSV() {
        var table = document.querySelector("#tablaHV");
        if (!table) { alert("No se encontró la tabla."); return; }
        var tbody = table.querySelector("tbody");
        var rows = tbody ? tbody.querySelectorAll("tr") : [];

        if (!rows || rows.length === 0) { alert("No hay datos para exportar."); return; }

        var sep = ";";
        // Ajusta estos encabezados a las columnas que estás mostrando en Razor
        var headers = ["Fecha", "Tipo", "Prefijo", "Número", "Total", "Forma de Pago", "Estado", "NIT", "Cliente", "CUFE"];
        var out = [headers.join(sep)];

        rows.forEach(function (tr) {
            if (tr.classList.contains("row-details")) return;
            var tds = tr.querySelectorAll("td");
            if (!tds || tds.length === 0) return;

            // Mapea por índice o por data-col (recomendado tener data-col en cada <td>)
            function get(colName, fallbackIndex) {
                var el = tr.querySelector('td[data-col="' + colName + '"]');
                if (el) return (el.textContent || "").trim();
                var td = tds[fallbackIndex];
                return td ? (td.textContent || "").trim() : "";
            }

            var fila = [
                get("fechaVenta", 0),
                get("tipoFactura", 1),
                get("prefijo", 2),
                get("numeroVenta", 3),
                (get("total", 4) || "").replace(/\./g, ","), // cambia separador decimal si quieres
                get("formaDePago", 5),
                get("estadoVenta", 6),
                get("nit", 7),
                get("nombreCliente", 8),
                get("cufe", 9)
            ];
            out.push(fila.join(sep));
        });

        var csv = out.join("\n");
        var blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        var hoy = new Date(), stamp = hoy.getFullYear() + String(hoy.getMonth() + 1).padStart(2, "0") + String(hoy.getDate()).padStart(2, "0");
        a.href = url;
        a.download = "historial_ventas_" + stamp + ".csv";
        a.click();
        URL.revokeObjectURL(url);
    }

    function imprimir() { window.print(); }

    // ===== Rango de Fechas (coherencia)
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

    // ===== Formularios / Acciones que van al servidor
    function wireServerActions() {
        var formNumero = byId("formNumero");

        // Submit al presionar Enter en número de factura
        byId("fNumeroFactura")?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (formNumero) {
                    e.preventDefault();
                    if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit();
                    else formNumero.submit();
                }
            }
        });

        // Botones principales
        byId("btnExportar")?.addEventListener("click", exportCSV);
        byId("btnImprimir")?.addEventListener("click", imprimir);
        byId("actExportar")?.addEventListener("click", exportCSV);
        byId("actImprimir")?.addEventListener("click", imprimir);

        // Placeholders simples (lado servidor pendiente)
        byId("actVerDetalle")?.addEventListener("click", function () {
            if (!requireSel()) return;
            alert("Ver detalle de " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? ""));
        });
        byId("actAnular")?.addEventListener("click", function () {
            if (!requireSel()) return;
            if (confirm("¿Anular la venta " + (selected.prefijo ? (selected.prefijo + "-") : "") + (selected.numeroVenta ?? "") + "?")) {
                console.log("TODO: llamar endpoint de anulación");
            }
        });
        byId("actCrearFE")?.addEventListener("click", function () { if (!requireSel()) return; alert("Crear Factura Electrónica (placeholder)"); });
        byId("actEnviarCorreo")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar por correo (placeholder)"); });
        byId("actDevolucion")?.addEventListener("click", function () { if (!requireSel()) return; alert("Devolución (placeholder)"); });
        byId("actPosAElectronica")?.addEventListener("click", function () { if (!requireSel()) return; alert("POS a Electrónica (placeholder)"); });
        byId("actClonar")?.addEventListener("click", function () { if (!requireSel()) return; alert("Clonar (placeholder)"); });
        byId("actAumentarNumero")?.addEventListener("click", function () { if (!requireSel()) return; alert("Aumentar número (placeholder)"); });
        byId("actEnviarDIAN")?.addEventListener("click", function () { if (!requireSel()) return; alert("Enviar DIAN (placeholder)"); });
        byId("actDescargarFactura")?.addEventListener("click", function () { if (!requireSel()) return; alert("Descargar Factura (placeholder)"); });

        // **Resoluciones** -> POST a ListaResoluciones con idventa seleccionado
        byId("actResolucion")?.addEventListener("click", function () {
            if (!requireSel()) return;
            var form = byId("formResolucion");
            var input = byId("inputIdVenta");
            if (!form || !input) { alert("No se encontró el formulario de Resolución."); return; }
            var idv = selected.idVenta || 0;
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
            var idv = selected.idVenta || 0;
            if (!idv || idv <= 0) { alert("No se pudo determinar el id de la venta seleccionada."); return; }
            inp.value = idv;
            form.submit();
        });
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
                + '<td>' + (r.consecutivo ?? 0) + ' <small class="text-muted">(' + (r.consecutivoInicial ?? 0) + ' inicial)</small></td>'
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

    // ===== INIT
    document.addEventListener("DOMContentLoaded", function () {
        // 1) Selección de fila y panel
        wireRowSelection();
        updateSidePanel();

        // 2) Rango de fechas + acciones que van al servidor
        wireDateRange();
        wireServerActions();

        // 3) Resoluciones (si vienen en Session["V_Resoluciones"])
        abrirModalResolucionesSiHayDatos();
        wireSeleccionResolucion();

        // 4) Modal de clientes (opcional)
        wireModalClientes();

        // 5) Tooltips Bootstrap (si los estás usando en celdas)
        if (window.bootstrap && typeof bootstrap.Tooltip === "function") {
            var triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(function (el) { new bootstrap.Tooltip(el); });
        }
    });
})();
