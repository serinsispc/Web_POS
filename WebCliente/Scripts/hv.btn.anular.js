/* hv.btn.anular.js */
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    function requireSel() {
        if (!HV.selected || !HV.selected.idVenta) {
            alert("Selecciona una venta primero.");
            return false;
        }
        return true;
    }

    document.addEventListener("DOMContentLoaded", function () {
        const btn = HV.byId("actAnular");
        const form = HV.byId("formAnular");
        const hid = HV.byId("idventa_anular");
        if (!btn || !form || !hid) return;

        // anti-doble submit
        form.addEventListener("submit", function () {
            HV.flags.ANULAR_BUSY = true;
            if (btn) btn.disabled = true;
        }, { once: true });

        btn.addEventListener("click", function () {
            if (!requireSel()) return;
            if (HV.flags.ANULAR_BUSY) return;

            const idv = HV.selected.idVenta || 0;
            const etiqueta = (HV.selected.prefijo ? (HV.selected.prefijo + "-") : "") + (HV.selected.numeroVenta ?? "");

            function confirmar() {
                HV.flags.ANULAR_BUSY = true;
                btn.disabled = true;
                hid.value = String(idv);
                if (typeof form.requestSubmit === "function") form.requestSubmit(); else form.submit();

                // fallback de reenable por si el server no redirige
                setTimeout(function () {
                    HV.flags.ANULAR_BUSY = false;
                    btn.disabled = false;
                }, 8000);
            }

            if (window.Swal && typeof Swal.fire === 'function') {
                Swal.fire({
                    icon: 'warning',
                    title: 'Confirmar anulación',
                    text: '¿Anular la venta ' + etiqueta + '?',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, anular',
                    cancelButtonText: 'Cancelar'
                }).then(res => { if (res.isConfirmed) confirmar(); });
            } else {
                if (confirm('¿Anular la venta ' + etiqueta + '?')) confirmar();
            }
        });
    });
})();
