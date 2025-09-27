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
            // Layout con padding y separación entre "Mostrar" y "Buscar"
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

            // Orden por Fecha (col 1)
            order: [[1, 'desc']],

            // Definición de columnas visibles (CUFE va oculta)
            columns: [
                { className: 'all' },                   // 0 Número
                { className: 'all' },                   // 1 Fecha
                { className: '' },                      // 2 Tipo
                { className: 'min-phone-l text-end' },  // 3 Total
                { className: '' },                      // 4 Forma de Pago
                { className: '' },                      // 5 Estado
                { className: '' },                      // 6 NIT
                { className: '' },                      // 7 Cliente
                { className: '' }                       // 8 CUFE (OCULTA)
            ],

            columnDefs: [
                { responsivePriority: 4, targets: 7 }, // Cliente
                { responsivePriority: 5, targets: 2 }, // Tipo
                { responsivePriority: 6, targets: 4 }, // Forma
                { responsivePriority: 7, targets: 5 }, // Estado
                { responsivePriority: 8, targets: 6 }, // NIT

                // Total: orden numérico correcto
                {
                    targets: 3,
                    render: function (data, type) {
                        if (type === 'sort' || type === 'type') return cleanMoneyToNumber(data);
                        return data;
                    }
                },

                // CUFE: oculto pero disponible para lógica y sin búsqueda
                { targets: 8, visible: false, searchable: false }
            ],

            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json' },
            deferRender: true,
            stateSave: true,

            // === Pintar fila completa SOLO por CUFE (col 8) ===
            createdRow: function (row, data) {
                try {
                    // data[8] existe aunque la columna esté oculta
                    var cufe = (data[8] || '').toString().trim().toUpperCase();

                    // Tolerante a variantes ("ACEPTADA", "ACEPTADO", "Aceptada por DIAN"...)
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

        // Tu selección de filas en historialventas.js sigue funcionando (delegada en <tbody>)
    });

})();
