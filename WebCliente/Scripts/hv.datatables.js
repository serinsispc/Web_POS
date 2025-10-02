// hv.datatables.js
// DataTables para #tablaHV con columnas (ORDEN REAL DEL DOM):
// 0 Número | 1 Fecha | 2 Tipo | 3 Total | 4 Forma de Pago | 5 Estado | 6 NIT | 7 Cliente | 8 Estado FE (VISIBLE)

(function () {
    'use strict';

    function cleanMoneyToNumber(txt) {
        if (!txt) return 0;
        var s = String(txt).replace(/\s/g, '').replace(/[^\d,.-]/g, '');
        if (s.indexOf(',') > -1 && s.indexOf('.') > -1) {
            s = s.replace(/\./g, '').replace(',', '.');
        } else if (s.indexOf(',') > -1 && s.indexOf('.') === -1) {
            s = s.replace(',', '.');
        }
        var n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    }

    $(function () {
        var $tabla = $('#tablaHV');
        if ($tabla.length === 0) return;

        var dt = $tabla.DataTable({
            dom:
                "<'dt-top d-flex flex-wrap align-items-center gap-2 px-2' l f>" +
                "t" +
                "<'dt-bottom d-flex flex-wrap justify-content-between align-items-center gap-2 px-2' i p>",

            // Responsive: detalle muestra columnas ocultas en fila hija
            responsive: {
                details: { type: 'inline', target: 'tr' },
                breakpoints: [
                    { name: 'xs', width: 0 },
                    { name: 'phone', width: 400 },
                    { name: 'phone-l', width: 416 },
                    { name: 'sm', width: 576 },
                    { name: 'md', width: 768 },
                    { name: 'lg', width: 992 },
                    { name: 'xl', width: 1200 }
                ]
            },

            paging: true,
            pageLength: 25,
            lengthMenu: [10, 25, 50, 100],
            order: [[1, 'desc']], // Fecha desc

            // Coincidir 1:1 con los <th> del DOM
            columns: [
                { className: 'all' },                      // 0 Número
                { className: 'all' },                      // 1 Fecha
                { className: '' },                         // 2 Tipo
                { className: 'min-phone-l text-end' },     // 3 Total (alineado derecha)
                { className: '' },                         // 4 Forma de Pago
                { className: '' },                         // 5 Estado
                { className: '' },                         // 6 NIT
                { className: '' },                         // 7 Cliente
                { className: 'all' }                       // 8 Estado FE (SIEMPRE visible)
            ],

            columnDefs: [
                // Prioridades responsive (menor = más importante)
                { responsivePriority: 1, targets: 0 }, // Número
                { responsivePriority: 2, targets: 1 }, // Fecha
                { responsivePriority: 3, targets: 3 }, // Total
                { responsivePriority: 4, targets: 8 }, // Estado FE (además marcado como 'all')
                { responsivePriority: 5, targets: 7 }, // Cliente
                { responsivePriority: 6, targets: 4 }, // Forma de Pago
                { responsivePriority: 7, targets: 5 }, // Estado
                { responsivePriority: 8, targets: 2 }, // Tipo
                { responsivePriority: 9, targets: 6 }, // NIT

                // Sort numérico por valor de dinero en "Total"
                {
                    targets: 3,
                    render: function (data, type) {
                        if (type === 'sort' || type === 'type') return cleanMoneyToNumber(data);
                        return data;
                    }
                },

                // Ajustes visuales para texto largo en Cliente
                {
                    targets: 7, // Cliente
                    createdCell: function (td) {
                        td.classList.add('text-wrap');
                        td.style.whiteSpace = 'normal';
                        td.style.wordBreak = 'break-word';
                    }
                },

                // Forzar visibilidad/búsqueda de ESTADO FE + wrap para no desbordar
                {
                    targets: 8,             // Estado FE
                    visible: true,
                    searchable: true,
                    createdCell: function (td) {
                        td.classList.add('text-break');
                        td.style.wordBreak = 'break-all';
                    }
                }
            ],

            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json' },
            deferRender: true,
            stateSave: true,

            // === COLOREADO: Fila por "Estado" (ANULADA) y celda por "Estado FE" ===
            createdRow: function (row, data) {
                try {
                    // Columnas según el orden real:
                    // data[5] = Estado
                    // data[8] = Estado FE
                    var estado = (data[5] || '').toString().trim().toUpperCase();
                    var estadoFE = (data[8] || '').toString().trim().toUpperCase();

                    // 1) Fila ROJA solo si Estado = ANULADA
                    //    Reutilizamos 'fila-negativa' que ya tienes en tu CSS (rojo para toda la fila)
                    if (estado.includes('ANUL')) {
                        row.classList.add('fila-negativa');
                    } else {
                        row.classList.remove('fila-negativa');
                    }

                    // 2) Pintar SOLO la celda de Estado FE (col 8)
                    var tdFE = row.cells && row.cells[8] ? row.cells[8] : null;
                    if (tdFE) {
                        // Limpiar clases anteriores de la celda FE (por si redraw)
                        tdFE.classList.remove('cell-fe-positiva', 'cell-fe-negativa');

                        var esAceptada = estadoFE.includes('ACEPT'); // ACEPTADA
                        var esDenegada = estadoFE.includes('DENEG') || estadoFE.includes('RECHAZ'); // DENEGADA/RECHAZADA

                        if (esDenegada) {
                            tdFE.classList.add('cell-fe-negativa'); // rojo en la CELDA
                        } else if (esAceptada) {
                            tdFE.classList.add('cell-fe-positiva'); // verde en la CELDA
                        }
                        // Si no es aceptada ni denegada, no se pinta la celda.
                    }
                } catch (e) {
                    console.error('createdRow (colores) error:', e);
                }
            }
        });

        // === Selección persistente con autoscroll ===
        var STORAGE_KEY = 'HV_idventa_seleccionada';

        $('#tablaHV tbody').on('click', 'tr', function (e) {
            if ($(e.target).closest('a,button,.btn,input,label,.dropdown-item').length) return;
            var id = this.getAttribute('data-idventa');
            if (!id) return;

            $('#tablaHV tbody tr.fila-activa').removeClass('fila-activa');
            this.classList.add('fila-activa');
            sessionStorage.setItem(STORAGE_KEY, id);
        });

        function reselectStickyRow() {
            var id = sessionStorage.getItem(STORAGE_KEY);
            if (!id) return;

            var targetIdx = null, targetNode = null;
            dt.rows({ search: 'applied', page: 'all' }).every(function (rowIdx) {
                var node = this.node();
                if (node && node.getAttribute('data-idventa') === id) {
                    targetIdx = rowIdx; targetNode = node;
                    return false;
                }
            });
            if (targetIdx == null) return;

            var info = dt.page.info();
            var pageLen = info.length;
            var targetPage = Math.floor(targetIdx / pageLen);

            function highlightAndScroll() {
                $('#tablaHV tbody tr.fila-activa').removeClass('fila-activa');
                if (targetNode && document.body.contains(targetNode)) {
                    targetNode.classList.add('fila-activa');
                    targetNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }

            if (info.page !== targetPage) {
                dt.page(targetPage).draw('page');
                setTimeout(highlightAndScroll, 60);
            } else {
                highlightAndScroll();
            }
        }

        dt.on('draw', reselectStickyRow);
        dt.on('responsive-display', reselectStickyRow);
        reselectStickyRow();

        window.HV_GetIdVentaSeleccionada = function () {
            return sessionStorage.getItem(STORAGE_KEY) || null;
        };
    });

})();
