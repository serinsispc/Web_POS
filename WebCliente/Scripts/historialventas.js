/* ======================================
   HISTORIAL VENTAS – LÓGICA DE FRONTEND (sin render de filas)
   v1.14.4
   --------------------------------------
   - FIX global: decodificación Base64 → UTF-8 segura (tildes/ñ correctas).
   - Export CSV usa "Estado FE" (no CUFE) según orden real del DOM.
   - Coloreado de filas se hace en hv.datatables.js (Estado FE).
   ====================================== */
(function () {
    "use strict";

    // ===== Utils
    var fmtCOP = new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 });
    function byId(id) { return document.getElementById(id); }
    function ymd(d) { return d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, '0') + "-" + String(d.getDate()).padStart(2, '0'); }
    function parseDate(val) { var d = val ? new Date(val) : null; return isNaN(d) ? null : d; }

    // ---------- NUEVO: helpers Base64 → UTF-8 seguros ----------
    function b64ToUtf8(b64) {
        try {
            if (!b64) return "";
            var bin = atob(b64);
            if (window.TextDecoder) {
                var bytes = new Uint8Array(bin.length);
                for (var i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return new TextDecoder('utf-8').decode(bytes);
            } else {
                // Fallback legacy
                return decodeURIComponent(escape(bin));
            }
        } catch (e) { return ""; }
    }
    function decodeBase64(b64) { return b64ToUtf8(b64); }
    function decodeB64ToJson(b64) {
        try {
            var txt = b64ToUtf8(b64);
            return txt ? JSON.parse(txt) : null;
        } catch (e) { return null; }
    }
    // -----------------------------------------------------------

    // Setea valor SOLO si es no vacío (para casos normales)
    function setIfVal(selector, val) {
        var v = (val === null || val === undefined) ? "" : String(val).trim();
        var $el = (window.jQuery ? window.jQuery(selector) : null);
        if ($el && $el.length) { if (v) $el.val(v); return; }
        var el = document.querySelector(selector);
        if (el && v) el.value = v;
    }
    // Setea valor SIEMPRE (incluso vacío, "0" o "-") – para reflejar exactamente lo que llegue del acquirer
    function setVal(selector, val) {
        var v = (val === null || val === undefined) ? "" : String(val);
        var $el = (window.jQuery ? window.jQuery(selector) : null);
        if ($el && $el.length) { $el.val(v); return; }
        var el = document.querySelector(selector);
        if (el) el.value = v;
    }
    function showSwal(title, text, icon) {
        if (window.Swal && typeof window.Swal.fire === "function") {
            return window.Swal.fire({
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
    }

    // ===== Estado de la UI
    var selected = null; // { idVenta, total, fechaVenta, prefijo, numeroVenta, ... }

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
        var idv = Number(tr.getAttribute("data-idventa") || "0");
        var total = Number(tr.getAttribute("data-total") || "0");
        var fechaIso = tr.getAttribute("data-fecha") || "";
        var fecha = parseDate(fechaIso);

        if (!total) {
            var totalCell = tr.querySelector('td[data-col="total"]') || tr.cells[3];
            if (totalCell) {
                var t = (totalCell.textContent || "").replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
                total = Number(t) || 0;
            }
        }
        if (!fecha) {
            var fCell = tr.querySelector('td[data-col="fechaVenta"]') || tr.cells[1];
            var txt = (fCell ? fCell.textContent : "").trim();
            var guess = parseDate(txt.replace(" ", "T"));
            fecha = isNaN(guess) ? null : guess;
        }

        var pref = tr.getAttribute("data-prefijo") || (tr.querySelector('td[data-col="prefijo"]')?.textContent || "").trim();
        var num = tr.getAttribute("data-numero") || (tr.querySelector('td[data-col="numeroVenta"]')?.textContent || "").trim();

        return { idVenta: idv, total: total, fechaVenta: fecha, prefijo: pref, numeroVenta: num };
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
            if (tr.classList.contains("row-details")) return;

            selected = leerItemDesdeFila(tr);
            clearRowSelection(tbody);
            tr.classList.add("row-selected");
            updateSidePanel();
        });
    }

    // ===== Acciones (placeholders + export)
    function requireSel() { if (!selected || !selected.idVenta) { alert("Selecciona una venta primero."); return false; } return true; }

    function exportCSV() {
        var table = document.querySelector("#tablaHV");
        if (!table) { alert("No se encontró la tabla."); return; }
        var tbody = table.querySelector("tbody");
        var rows = tbody ? tbody.querySelectorAll("tr") : [];
        if (!rows || rows.length === 0) { alert("No hay datos para exportar."); return; }

        var sep = ";";
        // Orden real del DOM:
        // 0 Número | 1 Fecha | 2 Tipo | 3 Total | 4 Forma de Pago | 5 Estado | 6 NIT | 7 Cliente | 8 Estado FE
        var headers = ["Número", "Fecha", "Tipo", "Total", "Forma de Pago", "Estado", "NIT", "Cliente", "Estado FE"];
        var out = [headers.join(sep)];

        rows.forEach(function (tr) {
            if (tr.classList.contains("row-details")) return;
            var tds = tr.querySelectorAll("td");
            if (!tds || tds.length === 0) return;

            function get(colName, fallbackIndex) {
                var el = tr.querySelector('td[data-col="' + colName + '"]');
                if (el) return (el.textContent || "").trim();
                var td = tds[fallbackIndex];
                return td ? (td.textContent || "").trim() : "";
            }

            var fila = [
                get("numeroVenta", 0),
                get("fechaVenta", 1),
                get("tipoFactura", 2),
                (get("total", 3) || "").replace(/\./g, ","), // opcional
                get("formaDePago", 4),
                get("estadoVenta", 5),
                get("nit", 6),
                get("nombreCliente", 7),
                get("estadoFE", 8)
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

    // ===== Rango de Fechas
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

    // ===== Formularios / Acciones servidor
    function wireServerActions() {
        var formNumero = byId("formNumero");

        byId("fNumeroFactura")?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (formNumero) {
                    e.preventDefault();
                    if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit();
                    else formNumero.submit();
                }
            }
        });

        byId("btnExportar")?.addEventListener("click", exportCSV);
        byId("btnImprimir")?.addEventListener("click", imprimir);
        byId("actExportar")?.addEventListener("click", exportCSV);
        byId("actImprimir")?.addEventListener("click", imprimir);

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
        byId("actDescargarFactura")?.addEventListener("click", function () { if (!requireSel()) return; alert("Descargar Factura (placeholder)"); });

        // **Resoluciones**
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

        // **Editar/Agregar Cliente**
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

        // **Enviar factura DIAN**
        byId("actEnviarDIAN")?.addEventListener("click", function () {
            if (!requireSel()) return;

            var form = byId("formEnviarDIAN");
            var inp = byId("inp-idventa-enviar");
            if (!form || !inp) {
                alert("No se encontró el formulario para enviar a la DIAN.");
                return;
            }

            var idv = selected.idVenta || 0;
            if (!idv || idv <= 0) {
                alert("No se pudo determinar el id de la venta seleccionada.");
                return;
            }

            inp.value = idv;
            form.submit();
        });

    }

    // ====== RESOLUCIONES (Modal) – (sin cambios de lógica, tildes OK por decode UTF-8) =====
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

    // ===== CLIENTES (Modal) – (sin cambios, tildes OK por decode UTF-8) =====
    function normalizarCliente(c) {
        return {
            id: c.id ?? c.idCliente ?? c.Id ?? 0,
            identificationNumber: (c.identificationNumber ?? c.Nit ?? "").toString(),
            nameCliente: (c.nameCliente ?? c.Nombre ?? "").toString(),
            tradeName: (c.tradeName ?? c.NombreComercial ?? "").toString(),
            phone: (c.phone ?? c.Telefono ?? "").toString(),
            adress: (c.adress ?? c.Direccion ?? "").toString(),
            email: (c.email ?? c.Correo ?? "").toString()
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

            tr.setAttribute("data-idcliente", c.id);
            tr.setAttribute("data-nit", c.identificationNumber);
            tr.setAttribute("data-nombre", c.nameCliente);
            tr.setAttribute("data-comercial", c.tradeName);
            tr.setAttribute("data-telefono", c.phone);
            tr.setAttribute("data-direccion", c.adress);
            tr.setAttribute("data-correo", c.email);

            tr.innerHTML =
                '<td>' + safe(c.identificationNumber) + '</td>' +
                '<td>' + safe(c.nameCliente) + '</td>' +
                '<td>' + safe(c.tradeName) + '</td>' +
                '<td>' + safe(c.phone) + '</td>' +
                '<td>' + safe(c.adress) + '</td>' +
                '<td>' + safe(c.email) + '</td>' +
                '<td class="text-nowrap">' +
                '  <button type="button" class="btn btn-primary btn-sm btn-sel-cliente">' +
                '    <i class="bi bi-check2-circle me-1"></i> Seleccionar' +
                '  </button> ' +
                '  <button type="button" class="btn btn-warning btn-sm cli-editar">' +
                '    <i class="bi bi-pencil-square me-1"></i> Editar' +
                '  </button>' +
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

        // Abre el modal si así se indicó, o si hay respuesta de DIAN (encontrado/no encontrado)
        if (window.DebeMostrarModalClientes === true || window.DebeMostrarModalClientes === "true" || window.AcquirerB64 || window.AcquirerMsg) {
            if (window.bootstrap && bootstrap.Modal) {
                var modalCli = new bootstrap.Modal(modalClientesEl, { backdrop: "static", keyboard: false });
                modalCli.show();
            }
        }

        // === BUSCAR general por texto
        $('#cli-buscar').on('input', function () {
            var texto = this.value || "";
            var lista = filtrarClientes(clientes, texto);
            pintarTablaClientes(lista);
        });
        $('#cli-limpiar').on('click', function () {
            $('#cli-buscar').val('').trigger('input');
        });

        // === NIT DIAN: SOLO NÚMEROS (input, keydown, paste)
        (function () {
            var $nit = $('#cli-dian-nit');

            $nit.on('input', function () {
                this.value = this.value.replace(/\D/g, '');
            });

            $nit.on('keydown', function (e) {
                var k = e.key;
                var ctrl = e.ctrlKey || e.metaKey;
                var allowed =
                    ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(k) ||
                    (ctrl && ['a', 'c', 'v', 'x'].includes(k.toLowerCase())) ||
                    (/^\d$/.test(k));
                if (!allowed) e.preventDefault();
                if (k === 'Enter') $('#cli-dian-btn').trigger('click');
            });

            $nit.on('paste', function (e) {
                e.preventDefault();
                var text = (e.originalEvent || e).clipboardData.getData('text') || '';
                this.value = (this.value + text.replace(/\D/g, '')).slice(0, this.maxLength || 50);
                $(this).trigger('input');
            });
        })();

        // === CONSULTAR DIAN (POST con AntiForgery, sin AJAX) ===
        $('#cli-dian-btn').on('click', function () {
            var nit = ($('#cli-dian-nit').val() || '').replace(/\D/g, '').trim();
            if (!nit) { alert('Ingrese un NIT para consultar.'); return; }

            // Envía el NIT al form oculto que postea a BuscarNIT_DIAN
            $('#nit_dian_hidden').val(nit);
            $('#formBuscarNIT_DIAN').trigger('submit');
        });

        // === EDITAR (abre panel)
        $('#tablaClientes').on('click', '.cli-editar', function () {
            var $tr = $(this).closest('tr');
            $('#cli-id').val($tr.data('idcliente') || '');
            $('#cli-nit').val($tr.data('nit') || '');
            $('#cli-nombre').val($tr.data('nombre') || '');
            $('#cli-comercial').val($tr.data('comercial') || '');
            $('#cli-telefono').val($tr.data('telefono') || '');
            $('#cli-direccion').val($tr.data('direccion') || '');
            $('#cli-correo').val($tr.data('correo') || '');

            $('#cli-editor').removeClass('d-none');
            setTimeout(function () {
                document.getElementById('cli-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }, 50);
        });

        // Cerrar editor
        $('#cli-editor-cerrar').on('click', function () {
            $('#cli-editor').addClass('d-none');
        });

        // Helpers editor
        function payloadCliente() {
            return {
                Id: $('#cli-id').val(),
                Nit: $('#cli-nit').val().trim(),
                Nombre: $('#cli-nombre').val().trim(),
                NombreComercial: $('#cli-comercial').val().trim(),
                Telefono: $('#cli-telefono').val().trim(),
                Direccion: $('#cli-direccion').val().trim(),
                Correo: $('#cli-correo').val().trim()
            };
        }

        function actualizarFilaDesdePayload(p) {
            var $tr = $('#tablaClientes tbody tr').filter(function () {
                return String($(this).data('idcliente')) === String(p.Id);
            }).first();

            if ($tr.length) {
                $tr.data('nit', p.Nit);
                $tr.data('nombre', p.Nombre);
                $tr.data('comercial', p.NombreComercial);
                $tr.data('telefono', p.Telefono);
                $tr.data('direccion', p.Direccion);
                $tr.data('correo', p.Correo);

                var tds = $tr.children('td');
                $(tds[0]).text(p.Nit);
                $(tds[1]).text(p.Nombre);
                $(tds[2]).text(p.NombreComercial);
                $(tds[3]).text(p.Telefono);
                $(tds[4]).text(p.Direccion);
                $(tds[5]).text(p.Correo);
            }
        }

        function guardarClienteCore(opts) {
            var p = payloadCliente();
            if (!p.Id) { alert('Seleccione un cliente para editar.'); return; }

            $.ajax({
                url: '/Clientes/EditarClienteAjax', // <-- AJUSTA
                type: 'POST',
                data: JSON.stringify(p),
                contentType: 'application/json; charset=utf-8'
            })
                .done(function () {
                    actualizarFilaDesdePayload(p);
                    if (opts && opts.seleccionar) {
                        $('#tablaClientes tbody tr').filter(function () {
                            return String($(this).data('idcliente')) === String(p.Id);
                        }).find('.btn-sel-cliente').trigger('click');
                    }
                    $('#cli-editor').addClass('d-none');
                })
                .fail(function (xhr) {
                    console.error(xhr.responseText || xhr.statusText);
                    alert('No se pudo guardar el cliente.');
                });
        }

        $('#cli-guardar').on('click', function () { guardarClienteCore({ seleccionar: false }); });
        $('#cli-guardar-y-seleccionar').on('click', function () { guardarClienteCore({ seleccionar: true }); });

        // === Seleccionar cliente (envía al servidor tu id)
        $('#tablaClientes').on('click', '.btn-sel-cliente', function () {
            var $tr = $(this).closest('tr');
            var idCli = $tr.data('idcliente');

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

        // === Prefill tras retorno de DIAN (Session["acquirer"] => TempData/DOM => window.*) ===
        (function () {
            var modalClientesEl = byId("modalClientes");
            if (!modalClientesEl) return;

            function q(sel) { return document.querySelector(sel); }
            function setRaw(sel, val) {
                var el = q(sel); if (!el) return;
                el.value = (val === null || val === undefined) ? "" : String(val);
            }
            function b64ToJsonSafe(b64) {
                try { var txt = b64ToUtf8(b64); return txt ? JSON.parse(txt) : null; } catch (e) { return null; }
            }
            function strToObj(s) {
                if (!s) return null;
                try { return JSON.parse(s); } catch (e) { return null; }
            }

            function readAcquirer() {
                var carrier = document.getElementById('acquirerData');
                if (carrier) {
                    var b64 = carrier.getAttribute('data-acquirer-json-b64') || "";
                    var o = b64ToJsonSafe(b64);
                    if (o) return o;
                }
                if (typeof window.AcquirerB64 === 'string') {
                    var o2 = b64ToJsonSafe(window.AcquirerB64);
                    if (o2) return o2;
                    var o3 = strToObj(window.AcquirerB64);
                    if (o3) return o3;
                }
                if (typeof window.Acquirer === 'object' && window.Acquirer) return window.Acquirer;
                if (typeof window.AcquirerJSON === 'string') {
                    var o4 = strToObj(window.AcquirerJSON);
                    if (o4) return o4;
                }
                return {};
            }

            var acq = readAcquirer();
            var msg = (typeof window.AcquirerMsg === 'string' && window.AcquirerMsg.trim())
                ? window.AcquirerMsg.trim()
                : String(acq.Message ?? acq.message ?? '').trim();

            var debeAbrir = !!msg || Object.keys(acq).length > 0 || window.DebeMostrarModalClientes === true || window.DebeMostrarModalClientes === "true";
            if (!debeAbrir) return;

            if (window.bootstrap && bootstrap.Modal) {
                var inst = new bootstrap.Modal(modalClientesEl, { backdrop: 'static', keyboard: false });
                inst.show();
            }
            $('#cli-editor').removeClass('d-none');

            var nitHidden = ($('#nit_dian_hidden').val() || '').replace(/\D/g, '');
            var nitQuery = ($('#cli-dian-nit').val() || '').replace(/\D/g, '');
            var nitFromAcq = String(acq.Nit ?? acq.nit ?? '').replace(/\D/g, '');
            var finalNit = nitFromAcq || nitHidden || nitQuery;

            var vals = {
                nit: finalNit,
                nombre: String(acq.Name ?? acq.name ?? ''),
                comercial: String(acq.NombreComercial ?? acq.CommercialName ?? acq.tradeName ?? ''),
                telefono: String(acq.Telefono ?? acq.Phone ?? acq.phone ?? ''),
                direccion: String(acq.Direccion ?? acq.Address ?? acq.address ?? ''),
                correo: String(acq.Email ?? acq.email ?? '')
            };

            function applyValues() {
                setRaw('#cli-nit', vals.nit);
                setRaw('#cli-dian-nit', vals.nit);
                setRaw('#cli-nombre', vals.nombre);
                setRaw('#cli-comercial', vals.comercial);
                setRaw('#cli-telefono', vals.telefono);
                setRaw('#cli-direccion', vals.direccion);
                setRaw('#cli-correo', vals.correo);
            }

            if (msg && window.Swal && typeof Swal.fire === 'function') {
                var texto = (vals.nit ? ('para el NIT ' + vals.nit + '. ') : '') + 'Se cargó la información disponible para que completes los datos.';
                Swal.fire({
                    icon: 'warning',
                    title: 'No se encontró registro en la DIAN',
                    text: texto,
                    confirmButtonText: 'Continuar',
                    allowOutsideClick: false,
                    allowEscapeKey: true
                }).then(function () {
                    applyValues();
                    var firstEmpty = ['#cli-nombre', '#cli-comercial', '#cli-telefono', '#cli-direccion', '#cli-correo']
                        .map(function (s) { return q(s); })
                        .find(function (el) { return el && (!el.value || String(el.value).trim() === ''); });
                    if (firstEmpty) try { firstEmpty.focus(); } catch { }
                });
            } else {
                applyValues();
            }

            console.debug('[HV] acquirer (final):', acq);
            console.debug('[HV] valores aplicados:', vals, 'mensaje:', msg);
        })();
    }

    // ===== INIT
    document.addEventListener("DOMContentLoaded", function () {
        wireRowSelection();
        updateSidePanel();

        wireDateRange();
        wireServerActions();

        abrirModalResolucionesSiHayDatos();
        wireSeleccionResolucion();

        wireModalClientes();

        if (window.bootstrap && typeof bootstrap.Tooltip === "function") {
            var triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(function (el) { new bootstrap.Tooltip(el); });
        }
    });
})();
