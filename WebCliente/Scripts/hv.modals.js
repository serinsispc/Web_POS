/* hv.modals.js
   Helpers para modales Bootstrap y limpieza de backdrops
*/
(function () {
    "use strict";
    const HV = window.HV;

    if (!HV) return;
    if (HV.Modals) return;

    const Modals = {};

    Modals.show = function (el, opts) {
        if (!el || !window.bootstrap || !bootstrap.Modal) return null;
        const inst = bootstrap.Modal.getOrCreateInstance(el, opts || {});
        inst.show();
        return inst;
    };

    Modals.hide = function (el) {
        if (!el || !window.bootstrap || !bootstrap.Modal) return;
        const inst = bootstrap.Modal.getInstance(el) || bootstrap.Modal.getOrCreateInstance(el);
        inst.hide();
    };

    Modals.cleanup = function () {
        try {
            document.querySelectorAll('.modal-backdrop').forEach(bd => bd.parentNode && bd.parentNode.removeChild(bd));
            document.body.classList.remove('modal-open');
            document.body.style.removeProperty('padding-right');
            document.body.style.removeProperty('overflow');
        } catch { /* no-op */ }
    };

    // auto-clean al cerrar
    ['modalClientes', 'modalResoluciones', 'modalMediosPago'].forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        el.addEventListener('hidden.bs.modal', () => {
            const inst = (window.bootstrap && bootstrap.Modal) ? bootstrap.Modal.getInstance(el) : null;
            if (inst && inst.dispose) inst.dispose();
            // Limpieza extra
            Modals.cleanup();

            // Caso especial: resolver resoluciones canceladas
            if (id === 'modalResoluciones') {
                try {
                    const token = document.querySelector('#formSelResol input[name="__RequestVerificationToken"]')?.value ||
                        document.querySelector('#formResolucion input[name="__RequestVerificationToken"]')?.value;
                    if (token) {
                        fetch('/HistorialVentas/CancelarResoluciones', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8' },
                            body: '__RequestVerificationToken=' + encodeURIComponent(token)
                        });
                    }
                } catch { /* no-op */ }
            }
        });
    });

    // cleanup al hacer click en cerrar
    document.addEventListener('click', function (e) {
        const btnClose = e.target.closest('[data-bs-dismiss="modal"], .btn-close');
        if (btnClose) setTimeout(Modals.cleanup, 100);
    });

    HV.Modals = Modals;
})();
