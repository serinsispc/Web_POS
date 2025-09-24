/* ==========================================
   HISTORIAL VENTAS – Vista Web (sin jQuery)
   Lee datos desde Session["HistorialVentasJson"]
   Acciones stub con POST x-www-form-urlencoded (campo "json")
   ========================================== */
'use strict';

(function () {
    // ---------- Carga de datos (base64 desde Razor) ----------
    const rawB64 = window.__FACTURAS_BASE64__ || '';
    let data = [];
    try {
        const json = rawB64 ? atob(rawB64) : '[]';
        data = JSON.parse(json);
    } catch (e) { console.warn('No se pudo parsear HISTORIAL JSON:', e); }

    // ---------- Helpers ----------
    const $ = (s, r = document) => r.querySelector(s);
    const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
    const elBody = $('#tabla-facturas tbody');
    const elStatus = $('#status-seleccion');
    const elTotal = $('#a-total-seleccion');

    const fmtCOP = v => (isFinite(v) ? v : 0)
        .toLocaleString('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 });
    const parseDate = s => {
        if (!s) return null;
        // admite "yyyy-MM-dd", ISO o "23/09/2025 9:58 a. m."
        const iso = Date.parse(s);
        if (!Number.isNaN(iso)) return new Date(iso);
        // intenta dd/MM/yyyy
        const m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s);
        if (m) { return new Date(+m[3], +m[2] - 1, +m[1]); }
        return null;
    };

    // Mapea nombres posibles del origen a una forma estándar
    function normalizeRow(r) {
        return {
            id: r.id ?? r.Id ?? r.Cuenta ?? null,
            Cuenta: r.Cuenta ?? r.NumCuenta ?? null,
            Fecha: r.Fecha ?? r.fecha ?? r.FechaEmision ?? r.issue_date ?? null,
            FechaISO: r.FechaISO ?? r.fecha_iso ?? null,
            FacturaRecibo: r.FacturaRecibo ?? r.TipoDoc ?? 'CAJA',
            Prefijo: r.Prefijo ?? r.prefijo ?? r.Prefix ?? '',
            IDResolucionDIAN: r.IDResolucionDIAN ?? r.idResolucion ?? r.IdResolucion ?? '',
            Cliente: r.Cliente ?? r.nombreCliente ?? r.customer_name ?? '',
            Cufe: r.Cufe ?? r.cufe ?? '',
            Numero: r.Numero ?? r.number ?? r.numeroFactura ?? '',
            Descuento: +((r.Descuento ?? r.descuento) || 0),
            SubTotal: +((r.SubTotal ?? r.subtotal ?? r.totalBruto) || 0),
            baseIva_5: +((r.baseIva_5 ?? r.baseiva_5 ?? r.baseiva5) || 0),
            baseIva_19: +((r.baseIva_19 ?? r.baseiva_19 ?? r.baseiva19) || 0),
            IVA_5: +((r.IVA_5 ?? r.iva_5) || 0),
            IVA_19: +((r.IVA_19 ?? r.iva_19) || 0),
            INC: +((r.INC ?? r.inc) || 0),
            EstadoFE: r.EstadoFE ?? r.estado_fe ?? null,
            EsElectronica: (r.EsElectronica ?? r.es_electronica ?? 1)
        };
    }

    // Estado
    const state = {
        rows: data.map(normalizeRow),
        filtered: [],
        selectedId: null,
        selectedRow: null
    };

    // ---------- Render ----------
    function renderRows(rows) {
        if (!rows.length) {
            elBody.innerHTML = `<tr><td colspan="15" class="text-center text-muted">Sin datos</td></tr>`;
            elStatus.textContent = '0 filas';
            elTotal.textContent = '$ 0';
            state.selectedId = null;
            state.selectedRow = null;
            return;
        }
        const frag = document.createDocumentFragment();
        rows.forEach(r => {
            const tr = document.createElement('tr');
            tr.dataset.id = r.id ?? r.Cuenta ?? '';
            tr.innerHTML = `
                <td>${r.Cuenta ?? ''}</td>
                <td>${r.Fecha ?? ''}</td>
                <td>${r.FacturaRecibo ?? 'CAJA'}</td>
                <td>${r.Prefijo ?? ''}</td>
                <td>${r.IDResolucionDIAN ?? ''}</td>
                <td>${r.Cliente ?? ''}</td>
                <td class="text-truncate" style="max-width:160px">${r.Cufe ?? ''}</td>
                <td>${r.Numero ?? ''}</td>
                <td class="text-end">${fmtCOP(r.Descuento)}</td>
                <td class="text-end">${fmtCOP(r.SubTotal)}</td>
                <td class="text-end">${fmtCOP(r.baseIva_5)}</td>
                <td class="text-end">${fmtCOP(r.baseIva_19)}</td>
                <td class="text-end">${fmtCOP(r.IVA_5)}</td>
                <td class="text-end">${fmtCOP(r.IVA_19)}</td>
                <td class="text-end">${fmtCOP(r.INC)}</td>
            `;
            tr.addEventListener('click', () => selectRow(tr, r));
            frag.appendChild(tr);
        });
        elBody.innerHTML = '';
        elBody.appendChild(frag);
        elStatus.textContent = `${rows.length} fila${rows.length !== 1 ? 's' : ''}`;
    }

    function selectRow(tr, row) {
        $$('#tabla-facturas tbody tr').forEach(x => x.classList.remove('selected'));
        tr.classList.add('selected');
        state.selectedId = row.id ?? row.Cuenta ?? null;
        state.selectedRow = row;

        const total = (row.SubTotal || 0) + (row.IVA_5 || 0) + (row.IVA_19 || 0) + (row.INC || 0) - (row.Descuento || 0);
        elTotal.textContent = fmtCOP(total);
    }

    // ---------- Filtros ----------
    function getFilters() {
        return {
            fecha: $('#f-fecha').value,
            rango: $('#r-dia').checked ? 'dia' : ($('#r-mes').checked ? 'mes' : 'anio'),
            numero: $('#f-numero').value.trim(),
            cliente: $('#f-cliente').value.trim().toLowerCase(),
            fePendientes: $('#f-fe-pendientes').checked,
            soloElectronicas: $('#f-solo-electronicas').checked
        };
    }

    function applyFilters() {
        const f = getFilters();
        let rows = [...state.rows];

        if (f.numero) {
            rows = rows.filter(x => String(x.Numero ?? '').includes(f.numero));
        }
        if (f.cliente) {
            rows = rows.filter(x => String(x.Cliente ?? '').toLowerCase().includes(f.cliente));
        }
        if (f.fecha) {
            const d = parseDate(f.fecha);
            if (d) {
                const y = d.getFullYear(), m = d.getMonth(), day = d.getDate();
                rows = rows.filter(x => {
                    const dx = parseDate(x.FechaISO ?? x.Fecha);
                    if (!dx) return false;
                    if (f.rango === 'anio') return dx.getFullYear() === y;
                    if (f.rango === 'mes') return dx.getFullYear() === y && dx.getMonth() === m;
                    return dx.getFullYear() === y && dx.getMonth() === m && dx.getDate() === day;
                });
            }
        }
        if (f.fePendientes) {
            rows = rows.filter(x => (x.EstadoFE ?? 'PENDIENTE') === 'PENDIENTE');
        }
        if (f.soloElectronicas) {
            rows = rows.filter(x => (x.EsElectronica ?? 1) == 1);
        }

        state.filtered = rows;
        renderRows(rows);
    }

    $('#btn-filtrar').addEventListener('click', applyFilters);
    $('#btn-eliminar-filtro').addEventListener('click', () => {
        $('#f-fecha').value = '';
        $('#f-numero').value = '';
        $('#f-cliente').value = '';
        $('#f-fe-pendientes').checked = false;
        $('#f-solo-electronicas').checked = false;
        $('#r-anio').checked = true;
        state.filtered = state.rows;
        renderRows(state.rows);
    });

    // ---------- Acciones (rutas sugeridas para HistorialVentasController) ----------
    async function postJson(url, payload) {
        const body = new URLSearchParams({ json: JSON.stringify(payload) });
        const resp = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body
        });
        return await resp.json();
    }
    function requireSel() {
        if (!state.selectedId) { alert('Selecciona una fila.'); return false; }
        return true;
    }

    // Sugerencia de endpoints (ajústalos si usas otros):
    const R = {
        imprimir: '/HistorialVentas/Imprimir',
        detalle: id => `/HistorialVentas/Detalle/${id}`,
        anular: '/HistorialVentas/Anular',
        crearFE: '/HistorialVentas/CrearFE',
        enviarDIAN: '/HistorialVentas/EnviarDIAN',
        enviarCorreo: '/HistorialVentas/EnviarCorreo',
        descargar: id => `/HistorialVentas/Descargar/${id}`,
        editarCliente: id => `/Clientes/EditarPorFactura/${id}`,
        editarFecha: '/HistorialVentas/EditarFecha'
    };

    $('#a-imprimir').addEventListener('click', async () => {
        if (!requireSel()) return;
        const r = await postJson(R.imprimir, { id: state.selectedId });
        alert(r.mensaje ?? 'Impresión enviada');
    });

    $('#a-detalle').addEventListener('click', () => {
        if (!requireSel()) return;
        window.location.href = R.detalle(state.selectedId);
    });

    $('#a-anular').addEventListener('click', async () => {
        if (!requireSel()) return;
        if (!confirm('¿Seguro que deseas anular la venta seleccionada?')) return;
        const r = await postJson(R.anular, { id: state.selectedId });
        alert(r.mensaje ?? 'Proceso completado');
        if (r.estado === 1) {
            state.rows = state.rows.filter(x => (x.id ?? x.Cuenta) !== state.selectedId);
            applyFilters();
        }
    });

    $('#a-crear-fe').addEventListener('click', async () => {
        if (!requireSel()) return;
        const r = await postJson(R.crearFE, { id: state.selectedId, fecha: $('#a-fecha-fe').value || null });
        alert(r.mensaje ?? 'F.E. generada');
    });

    $('#a-enviar-dian').addEventListener('click', async () => {
        if (!requireSel()) return;
        const r = await postJson(R.enviarDIAN, { id: state.selectedId });
        alert(r.mensaje ?? 'Enviado a DIAN');
    });

    $('#a-enviar-correo').addEventListener('click', async () => {
        if (!requireSel()) return;
        const r = await postJson(R.enviarCorreo, { id: state.selectedId });
        alert(r.mensaje ?? 'Correo enviado');
    });

    $('#a-descargar-fe').addEventListener('click', () => {
        if (!requireSel()) return;
        window.location.href = R.descargar(state.selectedId);
    });

    $('#a-editar-cliente').addEventListener('click', () => {
        if (!requireSel()) return;
        window.location.href = R.editarCliente(state.selectedId);
    });

    $('#a-editar-fecha').addEventListener('click', async () => {
        if (!requireSel()) return;
        const fecha = $('#a-fecha-fe').value;
        if (!fecha) { alert('Selecciona una fecha.'); return; }
        const r = await postJson(R.editarFecha, { id: state.selectedId, fecha });
        alert(r.mensaje ?? 'Fecha actualizada');
    });

    // ---------- Inicialización ----------
    $('#f-fecha').valueAsDate = new Date(); // hoy por defecto
    state.filtered = state.rows;
    renderRows(state.rows);
})();
