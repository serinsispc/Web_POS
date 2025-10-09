/* ======================================
   HV – Ver Detalle con botón #actVerDetalle
   v1.1.1
   ====================================== */
(function () {
    "use strict";

    let busy = false;

    // Helpers de formato
    const fmtCOP = n => Number(n || 0).toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const fmtNum = n => Number(n || 0).toLocaleString('es-CO');

    // UI refs
    const $btn = document.getElementById('actVerDetalle');
    const $modal = document.getElementById('modalVerDetalle');
    const modalBS = $modal ? new bootstrap.Modal($modal) : null;
    const $loader = document.getElementById('mdDet-loader');
    const $error = document.getElementById('mdDet-error');
    const $wrap = document.getElementById('mdDet-tablewrap');
    const $tbody = document.querySelector('#tablaDetalleVenta tbody');
    const $idventaL = document.getElementById('mdDet-idventa');
    const $subEl = document.getElementById('mdDet-subtotal');
    const $impEl = document.getElementById('mdDet-impuestos');
    const $totEl = document.getElementById('mdDet-total');

    function show(section) {
        $loader.classList.toggle('d-none', section !== 'loader');
        $wrap.classList.toggle('d-none', section !== 'table');
        $error.classList.toggle('d-none', section !== 'error');
    }
    function limpiar() {
        $tbody.innerHTML = '';
        $subEl.textContent = '';
        $impEl.textContent = '';
        $totEl.textContent = '';
        $error.textContent = '';
        show('loader');
    }

    // === 1) Obtener idventa de la fila seleccionada en DataTable ===
    function getSelectedIdVenta() {
        // a) Si usas DataTables con selección de fila (clase .selected)
        const trSel = document.querySelector('#tablaHV tbody tr.selected');
        if (trSel) {
            // 1: por data-idventa en el <tr>
            if (trSel.dataset && trSel.dataset.idventa) return trSel.dataset.idventa;
            // 2: por celda oculta con data-field="idventa"
            const cell = trSel.querySelector('td[data-field="idventa"]');
            if (cell && cell.textContent.trim()) return cell.textContent.trim();
        }

        // b) Si tienes DataTable y la fila seleccionada vía API:
        if (window.jQuery && $.fn.DataTable) {
            try {
                const dt = $('#tablaHV').DataTable();
                const row = dt.row({ selected: true });
                if (row && row.length) {
                    const data = row.data();
                    // pruebas comunes según tu modelo:
                    if (data?.idventa) return data.idventa;
                    if (data?.idVenta) return data.idVenta;
                    if (data?.id) return data.id; // si id == idventa en tu tabla
                }
            } catch (_) { /* sin DT o sin select extension */ }
        }

        // c) Fallback: hidden input que mantienes en tu UI
        const hid = document.getElementById('idventa_seleccionada');
        if (hid && hid.value) return hid.value;

        return null;
    }

    // === 2) Llamar al endpoint ===
    async function cargarDetalle(idventa) {
        const url = `/HistorialVentas/VerDetalle?idventa=${encodeURIComponent(idventa)}`;
        const resp = await fetch(url, { method: 'GET', credentials: 'same-origin' });
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        return await resp.json();
    }

    // === 3) Render con tu clase V_DetalleCaja ===
    function render(items) {
        let subtotalAcum = 0, impuestosAcum = 0, totalAcum = 0;

        const rows = (items || []).map((x, i) => {
            const cant = Number(x.unidad || 0);
            const precio = Number(x.precioVenta || 0);
            const desc = Number(x.descuentoDetalle || 0);
            const impPorc = Number(x.porImpuesto || 0);

            // subTotalDetalle (si no viene, usa subtotal_calc del back o cálculo simple)
            const sub = Number(x.subTotalDetalle || 0) || Number(x.subtotal_calc || (cant * precio - desc));
            const impVal = Number(x.valorImpuesto || (sub * (impPorc / 100)));
            const tot = Number(x.totalDetalle || 0) || (sub + impVal);

            subtotalAcum += sub;
            impuestosAcum += impVal;
            totalAcum += tot;

            return `
        <tr>
          <td>${i + 1}</td>
          <td>${x.codigoProducto || ''}</td>
          <td>${x.nombreProducto || ''}</td>
          <td>${x.presentacion || ''}</td>
          <td class="text-end">${fmtNum(cant)}</td>
          <td class="text-end">${fmtCOP(precio)}</td>
          <td class="text-end">${fmtCOP(desc)}</td>
          <td class="text-end">${fmtNum(impPorc)}</td>
          <td class="text-end">${fmtCOP(sub)}</td>
          <td class="text-end fw-semibold">${fmtCOP(tot)}</td>
          <td>${x.observacion || ''}</td>
        </tr>`;
        }).join('');

        $tbody.innerHTML = rows || `<tr><td colspan="11" class="text-center text-muted">Sin ítems…</td></tr>`;
        $subEl.textContent = fmtCOP(subtotalAcum);
        $impEl.textContent = fmtCOP(impuestosAcum);
        $totEl.textContent = fmtCOP(totalAcum);
        show('table');
    }

    // === 4) Click en tu botón único ===
    if ($btn) {
        $btn.addEventListener('click', async (ev) => {
            ev.preventDefault();
            if (busy || !modalBS) return;

            const idventa = getSelectedIdVenta();
            if (!idventa) {
                // Mensaje simple; reemplaza por tu AlertModerno si lo prefieres
                alert('Seleccione una venta primero.');
                return;
            }

            if ($idventaL) $idventaL.textContent = `#${idventa}`;
            limpiar();
            modalBS.show();
            busy = true;

            try {
                const data = await cargarDetalle(idventa);
                if (!data.ok) {
                    $error.textContent = data.message || 'No fue posible obtener el detalle.';
                    show('error');
                } else {
                    render(data.items || []);
                }
            } catch (err) {
                $error.textContent = err?.message || 'Error inesperado al consultar el detalle.';
                show('error');
            } finally {
                busy = false;
            }
        });
    }

    // Limpieza de backdrops “pegados” (por si abres otros modales)
    if ($modal) {
        $modal.addEventListener('hidden.bs.modal', () => {
            document.body.classList.remove('modal-open');
            document.querySelectorAll('.modal-backdrop').forEach(b => b.remove());
        });
    }
})();
