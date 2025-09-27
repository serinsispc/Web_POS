document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const manualToggle = document.getElementById('manualToggle');
    const toggleIcon = manualToggle?.querySelector('i');
    const toggleText = manualToggle?.querySelector('span');
    const backdrop = document.getElementById('sidebar-backdrop') || document.getElementById('backdrop');

    // Abrir sidebar en móviles
    if (toggleSidebar && sidebar && backdrop) {
        toggleSidebar.addEventListener('click', function () {
            sidebar.classList.toggle('active');
            backdrop.classList.toggle('d-none');
        });
    }

    // Contraer/expandir menú manualmente (modo escritorio)
    if (manualToggle && sidebar) {
        manualToggle.addEventListener('click', function () {
            const isCollapsed = sidebar.classList.contains('sidebar-collapsed');

            // Responsividad para pantallas pequeñas
            window.addEventListener("resize", function () {
                if (window.innerWidth < 576) {
                    sidebar.classList.add("sidebar-collapsed", "hide-text");
                    sidebar.classList.remove("sidebar-expanded");
                }
            });

            sidebar.classList.add('transitioning');

            setTimeout(() => {
                if (isCollapsed) {
                    sidebar.classList.remove('sidebar-collapsed', 'hide-text');
                    sidebar.classList.add('sidebar-expanded');
                    toggleIcon?.classList.replace('bi-arrow-bar-right', 'bi-arrow-bar-left');
                    if (toggleText) toggleText.textContent = ' Contraer';
                } else {
                    sidebar.classList.remove('sidebar-expanded');
                    sidebar.classList.add('sidebar-collapsed', 'hide-text');
                    toggleIcon?.classList.replace('bi-arrow-bar-left', 'bi-arrow-bar-right');
                    if (toggleText) toggleText.textContent = ' Expandir';
                }
            }, 50);
        });
    }

    // ✅ Cerrar sidebar en móvil SOLO si el enlace navega a otra página (href real)
    document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
        link.addEventListener('click', (e) => {
            if (!(window.innerWidth <= 768 && sidebar && backdrop)) return;

            const href = (link.getAttribute('href') || '').trim();
            const isToggle = href.startsWith('#') || link.hasAttribute('data-bs-toggle') || link.getAttribute('role') === 'button';

            // Si es un toggle de colapso/submenú o un ancla interna (#...), NO cerramos
            if (isToggle) return;

            // Si realmente navega (href absoluto/relativo distinto de "#"), cerramos
            if (href && href !== '#') {
                sidebar.classList.remove('active');
                backdrop.classList.add('d-none');
            }
        });
    });

    // Cerrar sidebar al hacer clic fuera (en el fondo oscuro)
    if (backdrop && sidebar) {
        backdrop.addEventListener('click', () => {
            sidebar.classList.remove('active');
            backdrop.classList.add('d-none');
        });
    }
});
