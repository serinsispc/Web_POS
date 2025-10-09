/* hv.btn.descargar.js (solo reemplaza helpers de decode y uso) */
(function () {
    "use strict";

    function getIdVentaSeleccionada() {
        const tr = document.querySelector('#tablaHV tbody tr.row-selected');
        if (tr?.dataset?.idventa) return parseInt(tr.dataset.idventa, 10) || 0;
        if (window.HV?.selected?.idventa) return +window.HV.selected.idventa || 0;
        return 0;
    }

    function getCsrf() {
        const input = document.querySelector('input[name="__RequestVerificationToken"]');
        return input ? input.value : '';
    }

    // Limpia y normaliza base64 para atob
    function sanitizeBase64(b64) {
        if (!b64) return "";
        // quita prefijo data-uri
        b64 = b64.replace(/^data:.*;base64,/i, "");
        // quita espacios/saltos de línea
        b64 = b64.replace(/\s+/g, "");
        // URL-safe -> estándar
        b64 = b64.replace(/-/g, "+").replace(/_/g, "/");
        // elimina cualquier char fuera de base64
        b64 = b64.replace(/[^A-Za-z0-9+/=]/g, "");
        // padding
        const pad = b64.length % 4;
        if (pad) b64 += "=".repeat(4 - pad);
        return b64;
    }

    function b64ToBlobSafe(b64, mime) {
        b64 = sanitizeBase64(b64);
        // intenta atob
        let byteChars;
        try {
            byteChars = atob(b64);
        } catch (e) {
            throw new Error("Base64 inválido tras sanitizar.");
        }
        const len = byteChars.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) bytes[i] = byteChars.charCodeAt(i);
        return new Blob([bytes], { type: mime || "application/pdf" });
    }

    async function descargarFactura(idventa) {
        const token = getCsrf();
        const url = (window.HV?.urls?.descargar) || "/HistorialVentas/Retour";

        const resp = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8" },
            body: `__RequestVerificationToken=${encodeURIComponent(token)}&idventa=${encodeURIComponent(idventa)}`
        });

        if (!resp.ok) {
            const txt = await resp.text();
            alert(`Error ${resp.status}: ${txt || "No fue posible obtener el PDF."}`);
            return;
        }

        const data = await resp.json();
        if (!data?.ok || !data.base64) {
            alert("Respuesta inválida: no hay PDF.");
            return;
        }

        try {
            const blob = b64ToBlobSafe(data.base64, "application/pdf");
            const objUrl = URL.createObjectURL(blob);
            window.open(objUrl, "_blank");
            setTimeout(() => URL.revokeObjectURL(objUrl), 60_000);
        } catch (err) {
            // Fallback: intentar abrir como data-uri directamente
            try {
                const clean = sanitizeBase64(data.base64);
                window.open(`data:application/pdf;base64,${clean}`, "_blank");
            } catch {
                alert("Error al descargar/mostrar el PDF: " + (err?.message || err));
            }
        }
    }

    document.addEventListener("DOMContentLoaded", () => {
        const btn = document.getElementById("actDescargarFactura");
        if (!btn || btn.__hv_desc_wired__) return;
        btn.__hv_desc_wired__ = true;

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            const id = getIdVentaSeleccionada();
            if (!id) return alert("Selecciona una venta primero.");
            descargarFactura(id).catch(err =>
                alert("Error al descargar/mostrar el PDF: " + (err?.message || err))
            );
        });
    });
})();
