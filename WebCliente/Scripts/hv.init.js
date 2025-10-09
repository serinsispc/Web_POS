/* hv.init.js
   - Orquesta el wiring global
   - Rango de fechas
   - Bootstrap fallback (sin inline)
   - SweetAlert AlertModerno (sin inline)
   - Limpieza URL post /Anularfactura (sin inline)
   - Restaurar filtros (sessionStorage) y re-seleccionar fila al volver
*/
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    // --- Fallback Bootstrap ---
    (function ensureBootstrap() {
        if (!window.bootstrap || !bootstrap.Modal) {
            const s = document.createElement('script');
            s.src = 'https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js';
            s.crossOrigin = 'anonymous';
            document.head.appendChild(s);
        }
    })();

    function wireDateRange() {
        const desde = HV.byId('fFechaDesde');
        const hasta = HV.byId('fFechaHasta');
        if (!desde || !hasta) return;

        function syncMinMax() {
            if (desde.value) { hasta.min = desde.value; } else { hasta.removeAttribute('min'); }
            if (hasta.value) { desde.max = hasta.value; } else { desde.removeAttribute('max'); }
        }
        desde.addEventListener('change', function () {
            if (!hasta.value && desde.value) hasta.value = desde.value;
            if (hasta.value && desde.value && new Date(hasta.value) < new Date(desde.value)) { hasta.value = desde.value; }
            syncMinMax();
        });
        hasta.addEventListener('change', function () {
            if (!desde.value && hasta.value) desde.value = hasta.value;
            if (hasta.value && desde.value && new Date(desde.value) > new Date(hasta.value)) { desde.value = hasta.value; }
            syncMinMax();
        });
        syncMinMax();
    }

    function showAlertModernoIfAny() {
        const el = document.getElementById('hv-alert');
        if (!el) return;

        const show = (el.getAttribute('data-show') || '').toLowerCase() === 'true';
        if (!show) return;

        const icon = el.getAttribute('data-icon') || 'info';
        const title = el.getAttribute('data-title') || '';
        const text = el.getAttribute('data-text') || '';

        if (window.Swal && typeof Swal.fire === 'function') {
            Swal.fire({
                icon,
                title,
                text,
                confirmButtonText: 'Aceptar'
            });
        } else {
            alert((title ? (title + ' - ') : '') + text);
        }
    }

    // --- Helpers de filtros (sessionStorage) ---
    function restoreInputsOnly() {
        const raw = sessionStorage.getItem('hv.filters');
        if (!raw) return;
        let filt = null;
        try { filt = JSON.parse(raw); } catch { filt = null; }
        if (!filt) return;

        const f1 = document.getElementById('fFechaDesde');
        const f2 = document.getElementById('fFechaHasta');
        const num = document.getElementById('fNumeroFactura');
        const cli = document.getElementById('fClienteTexto');

        if (f1) f1.value = filt.fecha1 || '';
        if (f2) f2.value = filt.fecha2 || '';
        if (num) num.value = filt.numero || '';
        if (cli) cli.value = filt.cliente || '';
    }

    function restoreAndApplyFiltersIfNeeded() {
        const APPLY_KEY = 'hv.filters.apply';
        const DATA_KEY = 'hv.filters';
        const mustApply = sessionStorage.getItem(APPLY_KEY) === '1';
        const raw = sessionStorage.getItem(DATA_KEY);
        if (!mustApply || !raw) return;

        let filt = null;
        try { filt = JSON.parse(raw); } catch { filt = null; }
        if (!filt) { sessionStorage.removeItem(APPLY_KEY); sessionStorage.removeItem(DATA_KEY); return; }

        const f1 = document.getElementById('fFechaDesde');
        const f2 = document.getElementById('fFechaHasta');
        const num = document.getElementById('fNumeroFactura');
        const cli = document.getElementById('fClienteTexto');

        if (f1) f1.value = filt.fecha1 || '';
        if (f2) f2.value = filt.fecha2 || '';
        if (num) num.value = filt.numero || '';
        if (cli) cli.value = filt.cliente || '';

        const formNumero = document.getElementById('formNumero');
        const formCliente = document.getElementById('formCliente');
        const formFechas = document.getElementById('formFechas');

        // Borramos el flag ANTES de enviar para evitar loops
        sessionStorage.removeItem(APPLY_KEY);
        sessionStorage.setItem(DATA_KEY, JSON.stringify(filt)); // conservar por si se necesita reintento

        if (num && num.value.trim() !== '' && formNumero) {
            if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit(); else formNumero.submit();
            return;
        }
        if (cli && cli.value.trim() !== '' && formCliente) {
            if (typeof formCliente.requestSubmit === "function") formCliente.requestSubmit(); else formCliente.submit();
            return;
        }
        if (f1 && f2 && f1.value && f2.value && formFechas) {
            if (typeof formFechas.requestSubmit === "function") formFechas.requestSubmit(); else formFechas.submit();
            return;
        }
        sessionStorage.removeItem(DATA_KEY);
    }

    // --- Reseleccionar la venta después de volver ---
    function reselectVentaFromStorage() {
        const KEY = 'hv.reselectIdVenta';
        let tries = 0;

        function attempt() {
            const id = sessionStorage.getItem(KEY);
            if (!id) return;

            const row = document.querySelector(`#tablaHV tbody tr[data-idventa="${id}"]`);
            if (row) {
                row.scrollIntoView({ block: 'center' });
                row.click();
                sessionStorage.removeItem(KEY);
            } else if (tries++ < 40) {
                setTimeout(attempt, 100); // espera a que la tabla se rellene tras un submit automático
            } else {
                sessionStorage.removeItem(KEY);
            }
        }
        attempt();
    }

    document.addEventListener("DOMContentLoaded", function () {
        HV.wireRowSelection();
        HV.updateSidePanel();

        wireDateRange();
        showAlertModernoIfAny();

        // Limpia la URL si vienes de POST /Anularfactura
        try {
            const p = location.pathname.toLowerCase();
            if (p.indexOf('/historialventas/anularfactura') >= 0) {
                history.replaceState(null, '', '/HistorialVentas/Index');
            }
        } catch { }

        // Tooltips
        if (window.bootstrap && typeof bootstrap.Tooltip === "function") {
            const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(el => new bootstrap.Tooltip(el));
        }

        // ===== Clave del fix: si vamos a auto-abrir el modal de Medios de Pago,
        // NO auto-enviamos filtros ahora (eso recargaba la página y cerraba el modal).
        const mpHolder = document.getElementById('hv-mp');
        const autoOpenMp = mpHolder && (mpHolder.getAttribute('data-auto') || '').toLowerCase() === 'true';

        if (autoOpenMp) {
            // Solo restauramos valores visuales de los inputs (sin submit)
            restoreInputsOnly();
        } else {
            // Flujo normal: restaurar y auto-aplicar filtros si venimos de otra navegación
            restoreAndApplyFiltersIfNeeded();
        }

        // Re-selección de la venta (funciona en ambos flujos)
        reselectVentaFromStorage();
    });

})();
