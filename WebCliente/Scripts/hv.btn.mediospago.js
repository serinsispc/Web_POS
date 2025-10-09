/* hv.btn.mediospago.js
   v1.3.0
   - Guarda filtros e idventa en sessionStorage antes de navegar
   - Post al Action con idventa (form oculto)
   - Auto-open y render (si traes data por carrier)
   - Guardar -> Swal success -> cerrar modal -> volver a Index
*/
(function () {
    "use strict";

    const HV = window.HV;
    if (!HV) return;

    // ---------- Utils ----------
    function waitForBootstrap(maxMs = 3000) {
        if (window.bootstrap && bootstrap.Modal) return Promise.resolve();
        return new Promise((res) => {
            const t0 = performance.now();
            const iv = setInterval(() => {
                if (window.bootstrap && bootstrap.Modal) { clearInterval(iv); res(); }
                else if (performance.now() - t0 > maxMs) { clearInterval(iv); res(); }
            }, 50);
        });
    }

    function getIdVentaSeleccionada() {
        if (HV.selected && (HV.selected.idVenta || HV.selected.idventa)) {
            return HV.selected.idVenta || HV.selected.idventa;
        }
        const tr =
            document.querySelector('#tablaHV tbody tr.row-selected') ||
            document.querySelector('#tablaHV tbody tr.table-active') ||
            document.querySelector('#tablaHV tbody tr.selected');
        if (tr && tr.dataset && tr.dataset.idventa) {
            const n = parseInt(tr.dataset.idventa, 10);
            return isNaN(n) ? 0 : n;
        }
        return 0;
    }

    // Guarda filtros actuales en sessionStorage (para restaurar tras el redirect)
    function saveCurrentFilters(forcedIdVenta) {
        const f1 = document.getElementById('fFechaDesde')?.value || '';
        const f2 = document.getElementById('fFechaHasta')?.value || '';
        const num = document.getElementById('fNumeroFactura')?.value || '';
        const cli = document.getElementById('fClienteTexto')?.value || '';
        const idv = forcedIdVenta || getIdVentaSeleccionada() || '';

        sessionStorage.setItem('hv.filters', JSON.stringify({
            fecha1: f1, fecha2: f2, numero: num, cliente: cli, idventa: String(idv || '')
        }));
        // marcador para que hv.init.js sepa que debe auto-aplicar filtros al volver
        sessionStorage.setItem('hv.filters.apply', '1');

        // también guardamos reselección explícitamente
        if (idv) sessionStorage.setItem('hv.reselectIdVenta', String(idv));
    }

    function postMediosDePago(idventa) {
        const form = document.getElementById("formMediosDePago");
        const input = document.getElementById("inp-idventa-medios");
        if (!form || !input) {
            alert("No se encontró el formulario oculto de Medios de Pago.");
            return;
        }
        saveCurrentFilters(idventa);
        input.value = String(idventa || 0);
        form.submit();
    }

    // ---------- Render helpers (auto-open desde carrier) ----------
    function filtrarInternosPorDian(internos, dianId) {
        const d = parseInt(dianId || 0, 10);
        return (internos || []).filter(x => parseInt(x.idMedioDePago || 0, 10) === d);
    }

    function renderFilaPago(tr, pago, paymentMethods, internos) {
        const dianIdByName = (() => {
            const m = (paymentMethods || []).find(pm =>
                (pm?.name || '').trim().toLowerCase() === (pago?.medioDePago || '').trim().toLowerCase());
            return m ? m.id : 0;
        })();

        tr.dataset.rowId = pago.id || 0;
        tr.dataset.currentInternoId = pago.idMedioDePagointerno || 0;

        tr.innerHTML = ''
            + '<td>'
            + '  <select class="form-select form-select-sm sel-dian w-100">'
            + '    <option value="0">-- Selecciona --</option>'
            + (paymentMethods || []).map(pm => `<option value="${pm.id}" ${pm.id === dianIdByName ? 'selected' : ''}>${pm.name}</option>`).join('')
            + '  </select>'
            + '</td>'
            + '<td>'
            + '  <div class="d-flex align-items-center gap-2 flex-wrap">'
            + '    <select class="form-select form-select-sm sel-interno" style="flex:1 1 180px;max-width:100%"></select>'
            + `    <small class="text-muted flex-grow-1">Actual: <strong>${(pago.medioPagoInterno || '-')}</strong></small>`
            + '  </div>'
            + '</td>'
            + '<td>'
            + '  <div class="input-group input-group-sm" style="max-width:160px">'
            + '    <span class="input-group-text">$</span>'
            + `    <input type="text" class="form-control inp-valor text-end" inputmode="numeric" autocomplete="off" value="${new Intl.NumberFormat('es-CO').format(pago.valorPago || 0)}">`
            + '  </div>'
            + '</td>'
            + '<td class="text-end">'
            + '  <button type="button" class="btn btn-sm btn-primary btn-guardar">'
            + '    <i class="bi bi-save"></i> Guardar'
            + '  </button>'
            + '</td>';

        const selDian = tr.querySelector('.sel-dian');
        const selInterno = tr.querySelector('.sel-interno');
        const inpValor = tr.querySelector('.inp-valor');
        const btnGuardar = tr.querySelector('.btn-guardar');

        function cargarInternos() {
            const opts = filtrarInternosPorDian(internos, selDian.value);
            selInterno.innerHTML = `<option value="0">-- Selecciona --</option>` +
                opts.map(o => `<option value="${o.idMediosDePagoInternos}">${o.nombreRMPI}</option>`).join('');
            const current = parseInt(tr.dataset.currentInternoId || '0', 10);
            if (current > 0 && opts.some(o => parseInt(o.idMediosDePagoInternos, 10) === current)) {
                selInterno.value = String(current);
            }
        }
        selDian.addEventListener('change', () => { tr.dataset.currentInternoId = '0'; cargarInternos(); });
        inpValor.addEventListener('input', () => { /* noop */ });
        cargarInternos();

        // Guardar
        btnGuardar.addEventListener('click', async () => {
            const idFila = parseInt(tr.dataset.rowId || '0', 10);
            const dianId = parseInt(selDian.value || '0', 10);
            const internoId = parseInt(selInterno.value || '0', 10);
            const valorNum = parseFloat(HV.normNum(inpValor.value) || '0');

            if (!idFila) { HV.showSwal('Validación', 'No se encontró el ID del pago.', 'warning'); return; }
            if (!dianId) { HV.showSwal('Validación', 'Selecciona el medio DIAN.', 'warning'); return; }
            if (!internoId) { HV.showSwal('Validación', 'Selecciona el medio interno.', 'warning'); return; }
            if (isNaN(valorNum) || valorNum < 0) { HV.showSwal('Validación', 'Ingresa un valor válido.', 'warning'); return; }

            const prev = btnGuardar.innerHTML;
            btnGuardar.disabled = true;
            btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

            try {
                const url = '/HistorialVentas/GuardarMedio';
                const AF = HV.getAntiForgeryToken();
                const body = new URLSearchParams({
                    "__RequestVerificationToken": AF,
                    "id": idFila,
                    "idMedioPagoDian": dianId,
                    "idMedioPagoInterno": internoId,
                    "valor": valorNum.toString()
                });

                const resp = await fetch(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                        'RequestVerificationToken': AF,
                        'X-Requested-With': 'XMLHttpRequest',
                        'Accept': 'application/json'
                    },
                    body,
                    credentials: 'same-origin'
                });

                const txt = await resp.text();
                const isJson = (resp.headers.get('content-type') || '').toLowerCase().includes('json');
                const data = isJson ? JSON.parse(txt) : null;
                if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 180)}`);

                const ok = data && (data.estado === 1 || data.estado === true || data.estado === '1' || data.estado === 'true');
                if (ok) {
                    tr.dataset.currentInternoId = String(internoId);

                    // Guardar filtros + idventa para restaurar tras el refresh
                    const idSel = HV?.selected?.idVenta || getIdVentaSeleccionada();
                    saveCurrentFilters(idSel);

                    await HV.showSwal('Guardado', data.mensaje || 'Cambios guardados', 'success');

                    // Cerrar modal y volver a Index
                    const modalEl = document.getElementById('modalMediosPago');
                    if (modalEl) {
                        if (HV.Modals && typeof HV.Modals.hide === 'function') {
                            HV.Modals.hide(modalEl);
                        } else if (window.bootstrap && bootstrap.Modal) {
                            const inst = bootstrap.Modal.getInstance(modalEl) || bootstrap.Modal.getOrCreateInstance(modalEl);
                            inst.hide();
                        } else {
                            modalEl.classList.remove('show');
                            modalEl.style.display = 'none';
                            document.body.classList.remove('modal-open');
                            document.querySelectorAll('.modal-backdrop').forEach(bd => bd.remove());
                        }
                    }
                    window.location.assign('/HistorialVentas/Index');
                    return;
                } else {
                    HV.showSwal('Atención', (data && data.mensaje) || 'No se pudo guardar.', 'warning');
                }
            } catch (err) {
                HV.showSwal('Error', err.message || 'Error al guardar.', 'error');
            } finally {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = prev;
            }
        });
    }

    function renderDesdeCarrierJson() {
        const holder = document.getElementById("hv-mp");
        if (!holder) return;

        const b64 = holder.getAttribute("data-json-b64") || "";
        if (!b64) return;

        let data = null;
        try {
            const jsonTxt = HV.b64ToUtf8(b64);
            data = jsonTxt ? JSON.parse(jsonTxt) : null;
        } catch { data = null; }

        const pagos = data?.pagos || [];
        const paymentMethods = data?.paymentMethods || [];
        const internos = data?.internos || [];
        const tbody = document.querySelector('#modalMediosPago #mp-tbody');
        if (!tbody) return;

        tbody.innerHTML = '';
        if (!Array.isArray(pagos) || pagos.length === 0) {
            tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay medios de pago registrados para esta venta.</td></tr>`;
            return;
        }
        const frag = document.createDocumentFragment();
        pagos.forEach(p => {
            const tr = document.createElement('tr');
            renderFilaPago(tr, p, paymentMethods, internos);
            frag.appendChild(tr);
        });
        tbody.appendChild(frag);
    }

    async function autoOpenIfNeeded() {
        const holder = document.getElementById("hv-mp");
        if (!holder) return;

        const mustOpen = (holder.getAttribute("data-auto") || "").toLowerCase() === "true";
        if (!mustOpen) return;

        await waitForBootstrap();

        // idventa en el título, si viene
        const idventaCarrier = holder.getAttribute("data-idventa") || "";
        const lbl = document.getElementById("mp-idventa");
        if (lbl && idventaCarrier) lbl.textContent = idventaCarrier;

        try { renderDesdeCarrierJson(); } catch { }

        const modalEl = document.getElementById('modalMediosPago');
        if (modalEl && HV.Modals?.show) HV.Modals.show(modalEl, { backdrop: "static" });
        else if (modalEl && window.bootstrap?.Modal) bootstrap.Modal.getOrCreateInstance(modalEl, { backdrop: "static" }).show();
        else if (modalEl) { modalEl.classList.add('show'); modalEl.style.display = 'block'; }
    }

    // API pública
    HV.openMediosDePago = function () {
        const idventa = getIdVentaSeleccionada();
        if (!idventa) { alert("Selecciona una venta en la tabla primero."); return; }
        saveCurrentFilters(idventa);
        postMediosDePago(idventa);
    };

    // Wire botón
    function wireButton() {
        const btn = document.getElementById("actMediosDePago");
        if (!btn) return;
        if (btn.__hv_wired__) return;
        btn.__hv_wired__ = true;

        btn.addEventListener("click", function (e) {
            e.preventDefault();
            e.stopPropagation();
            const idventa = getIdVentaSeleccionada();
            if (!idventa) { alert("Selecciona una venta en la tabla primero."); return; }
            saveCurrentFilters(idventa);
            postMediosDePago(idventa);
        });
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", () => { wireButton(); autoOpenIfNeeded(); }, { once: true });
    } else {
        wireButton();
        autoOpenIfNeeded();
    }
})();
