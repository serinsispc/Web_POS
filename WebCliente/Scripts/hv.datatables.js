// hv.datatables.js
// DataTables para #tablaHV con columnas:
// 0 Número | 1 Fecha | 2 Tipo | 3 Total | 4 Forma de Pago | 5 Estado | 6 NIT | 7 Cliente | 8 CUFE (OCULTA)

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
            order: [[1, 'desc']],

            columns: [
                { className: 'all' },                   // 0 Número
                { className: 'all' },                   // 1 Fecha
                { className: '' },                      // 2 Tipo
                { className: 'min-phone-l text-end' },  // 3 Total
                { className: '' },                      // 4 Forma de Pago
                { className: '' },                      // 5 Estado
                { className: '' },                      // 6 NIT
                { className: '' },                      // 7 Cliente
                { className: '' }                       // 8 CUFE (oculta)
            ],

            columnDefs: [
                { responsivePriority: 4, targets: 7 }, // Cliente
                { responsivePriority: 5, targets: 2 }, // Tipo
                { responsivePriority: 6, targets: 4 }, // Forma
                { responsivePriority: 7, targets: 5 }, // Estado
                { responsivePriority: 8, targets: 6 }, // NIT

                {
                    targets: 3,
                    render: function (data, type) {
                        if (type === 'sort' || type === 'type') return cleanMoneyToNumber(data);
                        return data;
                    }
                },

                { targets: 8, visible: false, searchable: false } // CUFE
            ],

            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json' },
            deferRender: true,
            stateSave: true,

            createdRow: function (row, data) {
                try {
                    var cufe = (data[8] || '').toString().trim().toUpperCase();
                    var esAceptada = cufe.includes('ACEPT');
                    var esRechazada = cufe.includes('RECHAZ');
                    if (esRechazada) {
                        row.classList.add('fila-negativa');
                    } else if (esAceptada) {
                        row.classList.add('fila-positiva');
                    }
                } catch (e) {
                    console.error('createdRow (CUFE) error:', e);
                }
            }
        });

        // === Selección persistente con autoscroll ===
        var STORAGE_KEY = 'HV_idventa_seleccionada';

        // Click para seleccionar y guardar
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
                    return false; // break
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
