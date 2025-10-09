/* hv.btn.dian.js */
(function () {
    "use strict";
    const HV = window.HV; if (!HV) return;

    document.addEventListener("DOMContentLoaded", function () {
        const btn = HV.byId("actEnviarDIAN");
        if (!btn) return;

        btn.addEventListener("click", function () {
            if (!HV.selected || !HV.selected.idVenta) { alert("Selecciona una venta primero."); return; }
            const form = HV.byId("formEnviarDIAN");
            const inp = HV.byId("inp-idventa-enviar");
            if (!form || !inp) { alert("No se encontró el formulario para la DIAN."); return; }
            inp.value = String(HV.selected.idVenta || 0);
            form.submit();
        });
    });
})();
