// hv.datatables.js
// DataTables para #tablaHV con columnas:
// 0 Número (prefijo + número) | 1 Fecha | 2 Tipo | 3 Total | 4 Forma | 5 Estado | 6 NIT | 7 Cliente | 8 CUFE

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
            responsive: {
                details: { type: 'inline', target: 'tr' },
                breakpoints: [
                    { name: 'xs', width: 0 },  // <400
                    { name: 'phone', width: 400 },  // >=400 (Número + Fecha siempre visibles)
                    { name: 'phone-l', width: 416 },  // >=416 (mantenemos también Total)
                    { name: 'sm', width: 576 },
                    { name: 'md', width: 768 },
                    { name: 'lg', width: 992 },
                    { name: 'xl', width: 1200 }
                ]
            },

            paging: true,
            pageLength: 25,
            lengthMenu: [10, 25, 50, 100],

            // Ahora la Fecha está en la columna 1
            order: [[1, 'desc']],

            // Visibilidad/priors por columna
            // 'all' = siempre visible; 'min-phone-l' = visible desde >=416px
            columns: [
                { className: 'all' },          // 0 - Número (prefijo + número) → SIEMPRE
                { className: 'all' },          // 1 - Fecha → SIEMPRE
                { className: '' },             // 2 - Tipo
                { className: 'min-phone-l text-end' }, // 3 - Total → desde 416px
                { className: '' },             // 4 - Forma de Pago
                { className: '' },             // 5 - Estado
                { className: '' },             // 6 - NIT
                { className: '' },             // 7 - Cliente
                { className: '' }              // 8 - CUFE
            ],

            columnDefs: [
                // Prioridades relativas para cuando hay espacio extra
                { responsivePriority: 4, targets: 7 }, // Cliente
                { responsivePriority: 5, targets: 2 }, // Tipo
                { responsivePriority: 6, targets: 4 }, // Forma
                { responsivePriority: 7, targets: 5 }, // Estado
                { responsivePriority: 8, targets: 6 }, // NIT
                { responsivePriority: 9, targets: 8 }, // CUFE (último)

                // Orden numérico correcto en "Total" (col 3)
                {
                    targets: 3,
                    render: function (data, type) {
                        if (type === 'sort' || type === 'type') return cleanMoneyToNumber(data);
                        return data;
                    }
                },
                // CUFE no participa en búsqueda
                { targets: 8, searchable: false }
            ],

            language: { url: 'https://cdn.datatables.net/plug-ins/1.13.8/i18n/es-ES.json' },
            deferRender: true,
            stateSave: true
        });

        // Tu selección de filas en historialventas.js sigue funcionando (delegada en <tbody>)
    });

})();
