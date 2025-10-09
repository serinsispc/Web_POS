/* hv.btn.cliente.js
   - Abre lista de clientes (POST BotonEditar_AgregarCliente)
   - Maneja modal Clientes cuando viene precargado desde Session/TempData (carriers)
   - Editor en línea + Seleccionar + DIAN
*/
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

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
        const tbody = document.querySelector("#tablaClientes tbody");
        if (!tbody) return;
        tbody.innerHTML = "";

        if (!Array.isArray(lista) || lista.length === 0) {
            const tr = document.createElement("tr");
            const td = document.createElement("td");
            td.colSpan = 7;
            td.className = "text-center text-muted";
            td.textContent = "No hay clientes para mostrar.";
            tr.appendChild(td);
            tbody.appendChild(tr);
            return;
        }

        function safe(v) { v = (v ?? "").toString().trim(); return v === "" ? "-" : v; }

        const frag = document.createDocumentFragment();
        lista.forEach(raw => {
            const c = normalizarCliente(raw);
            const tr = document.createElement("tr");
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
        const q = (texto ?? "").toString().trim().toUpperCase();
        if (!q) return lista.slice();
        return lista.filter(raw => {
            const c = normalizarCliente(raw);
            const s = [c.identificationNumber, c.nameCliente, c.tradeName, c.phone, c.adress, c.email].join(" | ").toUpperCase();
            return s.indexOf(q) >= 0;
        });
    }

    function readCarrierValue(sel, attr) {
        const el = document.querySelector(sel); if (!el) return "";
        return el.getAttribute(attr) || "";
    }

    function abrirModalClientesSiCorresponde() {
        const modalClientesEl = HV.byId("modalClientes");
        if (!modalClientesEl) return;

        // 1) clientes desde carrier (#hv-clientes)
        const clientesB64 = readCarrierValue("#hv-clientes", "data-clientes-b64");
        let clientes = HV.decodeB64ToJson(clientesB64);
        if (!Array.isArray(clientes)) clientes = [];

        pintarTablaClientes(clientes);

        // 2) flags de auto-show: carrier + acquirer data/msg (con validación real)
        const autoShowFromCarrier = (readCarrierValue("#hv-clientes", "data-autoshow") || "").toLowerCase() === "true";

        // Decode acquirer y valida que NO sea {} vacío
        const acqB64Temp = readCarrierValue("#acquirerTemp", "data-acquirer-b64");
        const acqB64Sess = readCarrierValue("#acquirerData", "data-acquirer-json-b64");
        const acqObjTemp = acqB64Temp ? HV.decodeB64ToJson(acqB64Temp) : null;
        const acqObjSess = acqB64Sess ? HV.decodeB64ToJson(acqB64Sess) : null;
        const acquirerHasData = !!(acqObjTemp && Object.keys(acqObjTemp).length) ||
            !!(acqObjSess && Object.keys(acqObjSess).length);

        const acquirerMsg = readCarrierValue("#acquirerTemp", "data-acquirer-msg");
        const hasMsg = !!(acquirerMsg && acquirerMsg.trim());

        // Solo abrir si:
        //  - autoshow y hay clientes cargados
        //  - ó hay datos de acquirer reales
        //  - ó hay mensaje de acquirer
        const debeAbrir = (autoShowFromCarrier && Array.isArray(clientes) && clientes.length > 0)
            || acquirerHasData
            || hasMsg;

        if (debeAbrir && !HV.flags.MODAL_AUTOOPENED) {
            HV.Modals.show(modalClientesEl, { backdrop: "static", keyboard: false });
            HV.flags.MODAL_AUTOOPENED = true;
        }

        // 3) Búsqueda/limpiar (jQuery opcional)
        const $ = window.jQuery;
        if ($) {
            $('#cli-buscar').on('input', function () {
                const lista = filtrarClientes(clientes, this.value || "");
                pintarTablaClientes(lista);
            });
            $('#cli-limpiar').on('click', function () {
                $('#cli-buscar').val('').trigger('input');
            });
        }

        // 4) Validadores de NIT
        (function () {
            const $ = window.jQuery; if (!$) return;
            const $nit = $('#cli-dian-nit');

            $nit.on('input', function () { this.value = this.value.replace(/\D/g, ''); });
            $nit.on('keydown', function (e) {
                const k = e.key, ctrl = e.ctrlKey || e.metaKey;
                const allowed = ['Backspace', 'Delete', 'Tab', 'ArrowLeft', 'ArrowRight', 'Home', 'End', 'Enter'].includes(k) ||
                    (ctrl && ['a', 'c', 'v', 'x'].includes(k.toLowerCase())) || (/^\d$/.test(k));
                if (!allowed) e.preventDefault();
                if (k === 'Enter') $('#cli-dian-btn').trigger('click');
            });
            $nit.on('paste', function (e) {
                e.preventDefault();
                const text = (e.originalEvent || e).clipboardData.getData('text') || '';
                this.value = (this.value + text.replace(/\D/g, '')).slice(0, this.maxLength || 50);
                $(this).trigger('input');
            });
        })();

        // 5) Consultar DIAN
        (function () {
            const $ = window.jQuery; if (!$) return;
            $('#cli-dian-btn').on('click', function () {
                const nit = ($('#cli-dian-nit').val() || '').replace(/\D/g, '').trim();
                if (!nit) { alert('Ingrese un NIT para consultar.'); return; }
                $('#nit_dian_hidden').val(nit);
                $('#formBuscarNIT_DIAN').trigger('submit');
            });
        })();

        // 6) Editor + guardar + seleccionar
        (function () {
            const $ = window.jQuery; if (!$) return;

            $('#tablaClientes').on('click', '.cli-editar', function () {
                const $tr = $(this).closest('tr');
                $('#cli-id').val($tr.data('idcliente') || '');
                $('#cli-nit').val($tr.data('nit') || '');
                $('#cli-nombre').val($tr.data('nombre') || '');
                $('#cli-comercial').val($tr.data('comercial') || '');
                $('#cli-telefono').val($tr.data('telefono') || '');
                $('#cli-direccion').val($tr.data('direccion') || '');
                $('#cli-correo').val($tr.data('correo') || '');
                $('#cli-editor').removeClass('d-none');
                setTimeout(() => { document.getElementById('cli-editor')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }, 50);
            });

            $('#cli-editor-cerrar').on('click', function () { $('#cli-editor').addClass('d-none'); });

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
                const $tr = $('#tablaClientes tbody tr').filter(function () { return String($(this).data('idcliente')) === String(p.Id); }).first();
                if ($tr.length) {
                    $tr.data('nit', p.Nit).data('nombre', p.Nombre).data('comercial', p.NombreComercial)
                        .data('telefono', p.Telefono).data('direccion', p.Direccion).data('correo', p.Correo);
                    const tds = $tr.children('td');
                    $(tds[0]).text(p.Nit);
                    $(tds[1]).text(p.Nombre);
                    $(tds[2]).text(p.NombreComercial);
                    $(tds[3]).text(p.Telefono);
                    $(tds[4]).text(p.Direccion);
                    $(tds[5]).text(p.Correo);
                }
            }
            function guardarClienteCore(opts) {
                const p = payloadCliente();
                if (!p.Id) { alert('Seleccione un cliente para editar.'); return; }
                $.ajax({
                    url: '/Clientes/EditarClienteAjax', // ajusta si usas otra ruta
                    type: 'POST',
                    data: JSON.stringify(p),
                    contentType: 'application/json; charset=utf-8'
                })
                    .done(function () {
                        actualizarFilaDesdePayload(p);
                        if (opts && opts.seleccionar) {
                            $('#tablaClientes tbody tr').filter(function () { return String($(this).data('idcliente')) === String(p.Id); })
                                .find('.btn-sel-cliente').trigger('click');
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

            $('#tablaClientes').on('click', '.btn-sel-cliente', function () {
                const $tr = $(this).closest('tr');
                const idCli = $tr.data('idcliente');
                const hid = HV.byId("idClienteSeleccionado");
                const form = HV.byId("formSeleccionarCliente");
                const modalClientesEl = HV.byId("modalClientes");
                if (hid && form) {
                    hid.value = idCli;
                    if (modalClientesEl) HV.Modals.hide(modalClientesEl);
                    form.submit();
                }
            });
        })();

        // 7) Autorrelleno/avisos desde acquirer (Session/TempData), sin JS inline
        (function () {
            const modalClientesEl = HV.byId("modalClientes"); if (!modalClientesEl) return;

            function strToObj(s) { try { return s ? JSON.parse(s) : null; } catch { return null; } }
            function readAcquirer() {
                // Preferir TempData si existe
                const b64Temp = readCarrierValue("#acquirerTemp", "data-acquirer-b64");
                if (b64Temp) { const o = HV.decodeB64ToJson(b64Temp); if (o) return o; const o2 = strToObj(b64Temp); if (o2) return o2; }

                // Luego Session
                const b64Sess = readCarrierValue("#acquirerData", "data-acquirer-json-b64");
                if (b64Sess) { const o3 = HV.decodeB64ToJson(b64Sess); if (o3) return o3; }

                return {};
            }
            const acq = readAcquirer();
            const msg = readCarrierValue("#acquirerTemp", "data-acquirer-msg") ||
                String(acq.Message ?? acq.message ?? '').trim();

            const debeAbrir = !!msg || Object.keys(acq).length > 0 ||
                (readCarrierValue("#hv-clientes", "data-autoshow").toLowerCase() === "true" && Array.isArray(clientes) && clientes.length > 0);
            if (!debeAbrir) return;

            if (!HV.flags.MODAL_AUTOOPENED) {
                HV.Modals.show(modalClientesEl, { backdrop: 'static', keyboard: false });
                HV.flags.MODAL_AUTOOPENED = true;
            }
            document.getElementById('cli-editor')?.classList.remove('d-none');

            const nitHidden = (document.getElementById('nit_dian_hidden')?.value || '').replace(/\D/g, '');
            const nitQuery = (document.getElementById('cli-dian-nit')?.value || '').replace(/\D/g, '');
            const nitFromAcq = String(acq.Nit ?? acq.nit ?? '').replace(/\D/g, '');
            const finalNit = nitFromAcq || nitHidden || nitQuery;

            const vals = {
                nit: finalNit,
                nombre: String(acq.Name ?? acq.name ?? ''),
                comercial: String(acq.NombreComercial ?? acq.CommercialName ?? acq.tradeName ?? ''),
                telefono: String(acq.Telefono ?? acq.Phone ?? acq.phone ?? ''),
                direccion: String(acq.Direccion ?? acq.Address ?? acq.address ?? ''),
                correo: String(acq.Email ?? acq.email ?? '')
            };

            function setRaw(sel, val) { const el = document.querySelector(sel); if (el) el.value = (val ?? ""); }
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
                const texto = (vals.nit ? ('para el NIT ' + vals.nit + '. ') : '') + 'Se cargó la información disponible para que completes los datos.';
                Swal.fire({
                    icon: 'warning',
                    title: 'No se encontró registro en la DIAN',
                    text: texto,
                    confirmButtonText: 'Continuar',
                    allowOutsideClick: false,
                    allowEscapeKey: true
                }).then(function () {
                    applyValues();
                    const firstEmpty = ['#cli-nombre', '#cli-comercial', '#cli-telefono', '#cli-direccion', '#cli-correo']
                        .map(s => document.querySelector(s))
                        .find(el => el && (!el.value || String(el.value).trim() === ''));
                    if (firstEmpty) try { firstEmpty.focus(); } catch { }
                });
            } else {
                applyValues();
            }
        })();
    }

    // Botón que manda a la acción BotonEditar_AgregarCliente (sin JS inline)
    document.addEventListener("DOMContentLoaded", function () {
        const btn = HV.byId("actEditarCliente");
        if (btn) {
            btn.addEventListener("click", function () {
                if (!HV.selected || !HV.selected.idVenta) { alert("Selecciona una venta primero."); return; }
                const form = HV.byId("formListaClientes");
                const inp = HV.byId("inp-idventa-cliente");
                if (!form || !inp) { alert("No se encontró el formulario de clientes."); return; }
                inp.value = String(HV.selected.idVenta || 0);
                form.submit();
            });
        }

        // Si llegó precargado, abrir/cablear si corresponde
        abrirModalClientesSiCorresponde();
    });

})();
