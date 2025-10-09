/* hv.btn.mediospago.js
   - Abre modal
   - Llama /HistorialVentas/MediosDePago por AJAX (JSON)
   - Renderiza filas
   - Permite guardar cambios por fila (POST /HistorialVentas/GuardarMedio)
*/
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    // Render helpers
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

        tr.innerHTML = `
      <td class="text-nowrap">
        <select class="form-select form-select-sm sel-dian w-auto" style="min-width:220px">
          <option value="0">-- Selecciona --</option>
          ${(paymentMethods || []).map(pm => `<option value="${pm.id}" ${pm.id === dianIdByName ? 'selected' : ''}>${pm.name}</option>`).join('')}
        </select>
      </td>
      <td class="text-nowrap">
        <div class="d-flex align-items-center flex-nowrap gap-2">
          <select class="form-select form-select-sm sel-interno w-auto" style="min-width:220px"></select>
          <small class="text-muted">Actual: <strong>${(pago.medioPagoInterno || '-')}</strong></small>
        </div>
      </td>
      <td class="text-nowrap">
        <div class="input-group input-group-sm w-auto" style="min-width:140px">
          <span class="input-group-text">$</span>
          <input type="text" class="form-control inp-valor text-end" inputmode="numeric" autocomplete="off"
                 value="${(new Intl.NumberFormat('es-CO').format(pago.valorPago || 0))}">
        </div>
      </td>
      <td class="text-nowrap">
        <button type="button" class="btn btn-sm btn-primary btn-guardar">
          <i class="bi bi-save"></i> Guardar
        </button>
      </td>
    `;

        const selDian = tr.querySelector('.sel-dian');
        const selInterno = tr.querySelector('.sel-interno');

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
        cargarInternos();

        tr.querySelector('.btn-guardar').addEventListener('click', async () => {
            const idFila = parseInt(tr.dataset.rowId || '0', 10);
            const dianId = parseInt(selDian.value || '0', 10);
            const internoId = parseInt(selInterno.value || '0', 10);
            const valorNum = parseFloat(HV.normNum(tr.querySelector('.inp-valor').value) || '0');

            if (!idFila) { HV.showSwal('Validación', 'No se encontró el ID del pago.', 'warning'); return; }
            if (!dianId) { HV.showSwal('Validación', 'Selecciona el medio DIAN.', 'warning'); return; }
            if (!internoId) { HV.showSwal('Validación', 'Selecciona el medio interno.', 'warning'); return; }
            if (isNaN(valorNum) || valorNum < 0) { HV.showSwal('Validación', 'Ingresa un valor válido.', 'warning'); return; }

            const btn = tr.querySelector('.btn-guardar');
            const prev = btn.innerHTML;
            btn.disabled = true;
            btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Guardando...';

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

                if (!resp.ok) throw new Error(`HTTP ${resp.status}: ${txt.slice(0, 120)}`);
                const ok = data && (data.estado === 1 || data.estado === true || data.estado === '1' || data.estado === 'true');
                if (ok) {
                    tr.dataset.currentInternoId = String(internoId);
                    HV.showSwal('Guardado', data.mensaje || 'Cambios guardados', 'success');
                } else {
                    HV.showSwal('Atención', (data && data.mensaje) || 'No se pudo guardar.', 'warning');
                }
            } catch (err) {
                HV.showSwal('Error', err.message || 'Error al guardar.', 'error');
            } finally {
                btn.disabled = false;
                btn.innerHTML = prev;
            }
        });
    }

    async function abrirMediosDePagoModal(idventa) {
        const modalEl = document.getElementById('modalMediosPago');
        if (!modalEl) return alert('No se encontró el modal de Medios de Pago.');
        const body = modalEl.querySelector('.modal-body');

        body.innerHTML = '<div class="text-center py-4"><div class="spinner-border" role="status"></div><div class="mt-2">Cargando...</div></div>';
        HV.Modals.show(modalEl, { backdrop: "static" });

        try {
            const AF = HV.getAntiForgeryToken();
            const resp = await fetch('/HistorialVentas/MediosDePago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'RequestVerificationToken': AF,
                    'X-Requested-With': 'XMLHttpRequest',   // para que el server responda JSON
                    'Accept': 'application/json'
                },
                body: '__RequestVerificationToken=' + encodeURIComponent(AF) + '&idventa=' + encodeURIComponent(idventa),
                credentials: 'same-origin'
            });

            const txt = await resp.text();
            const isJson = (resp.headers.get('content-type') || '').toLowerCase().includes('json');
            const data = isJson ? JSON.parse(txt) : null;

            if (!resp.ok || !data?.estado) {
                throw new Error((data && data.mensaje) || 'No se pudo obtener la información.');
            }

            document.getElementById('mp-idventa')?.textContent = String(idventa);

            const pagos = data.data?.pagos || [];
            const paymentMethods = data.data?.paymentMethods || []; // opcional, según tu API
            const internos = data.data?.internos || [];            // opcional, según tu API

            // Render
            const table = document.createElement('div');
            table.className = 'table-responsive';
            table.innerHTML = `
        <table class="table table-sm align-middle mb-0">
          <thead>
            <tr>
              <th style="width:30%">Medio DIAN</th>
              <th style="width:30%">Medio interno</th>
              <th style="width:20%">Valor</th>
              <th style="width:20%">Acciones</th>
            </tr>
          </thead>
          <tbody id="mp-tbody"></tbody>
        </table>
      `;

            const tbody = table.querySelector('#mp-tbody');
            if (pagos.length === 0) {
                tbody.innerHTML = `<tr><td colspan="4" class="text-center text-muted py-4">No hay medios de pago registrados para esta venta.</td></tr>`;
            } else {
                pagos.forEach(p => {
                    const tr = document.createElement('tr');
                    renderFilaPago(tr, p, paymentMethods, internos);
                    tbody.appendChild(tr);
                });
            }
            body.innerHTML = "";
            body.appendChild(table);

        } catch (err) {
            body.innerHTML = `<div class="alert alert-danger">${err?.message || 'Error cargando datos'}</div>`;
        }
    }

    // Exponer para otros módulos
    HV.openMediosDePago = abrirMediosDePagoModal;

    // Wire del botón
    document.addEventListener("DOMContentLoaded", function () {
        const btn = HV.byId("actMediosDePago");
        if (!btn) return;

        const requireSel = () => {
            if (!HV.selected || !HV.selected.idVenta) { alert("Selecciona una venta primero."); return false; }
            return true;
        };

        btn.addEventListener("click", async (ev) => {
            ev.preventDefault();
            ev.stopImmediatePropagation();
            if (!requireSel()) return;
            await abrirMediosDePagoModal(HV.selected.idVenta || 0);
        });
    });

})();
