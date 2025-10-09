/* hv.init.js
   - Orquesta el wiring global
   - Rango de fechas
   - Bootstrap fallback (sin inline)
   - SweetAlert AlertModerno (sin inline)
   - Limpieza URL post /Anularfactura (sin inline)
*/
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    // --- Fallback Bootstrap (migrado del inline) ---
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

    document.addEventListener("DOMContentLoaded", function () {
        // Tabla: selección y panel
        HV.wireRowSelection();
        HV.updateSidePanel();

        // Fechas
        wireDateRange();

        // Enter en Número Factura => submit form
        const formNumero = HV.byId("formNumero");
        document.getElementById("fNumeroFactura")?.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                if (formNumero) {
                    e.preventDefault();
                    if (typeof formNumero.requestSubmit === "function") formNumero.requestSubmit();
                    else formNumero.submit();
                }
            }
        });

        // SweetAlert AlertModerno (sin inline)
        showAlertModernoIfAny();

        // Limpia la URL si vienes de POST /Anularfactura
        try {
            const p = location.pathname.toLowerCase();
            if (p.indexOf('/historialventas/anularfactura') >= 0) {
                history.replaceState(null, '', '/HistorialVentas/Index');
            }
        } catch { /* no-op */ }

        // Tooltips (si existen)
        if (window.bootstrap && typeof bootstrap.Tooltip === "function") {
            const triggers = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
            triggers.forEach(el => new bootstrap.Tooltip(el));
        }
    });

})();
