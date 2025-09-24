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

    // Contraer/expandir menú manualmente
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
                    toggleText.textContent = ' Contraer';
                } else {
                    sidebar.classList.remove('sidebar-expanded');
                    sidebar.classList.add('sidebar-collapsed', 'hide-text');
                    toggleIcon?.classList.replace('bi-arrow-bar-left', 'bi-arrow-bar-right');
                    toggleText.textContent = ' Expandir';
                }
            }, 50);
        });
    }

    // Cerrar sidebar al hacer clic en enlaces (solo en móviles)
    document.querySelectorAll('#sidebar .nav-link, #sidebar .submenu-link').forEach(link => {
        link.addEventListener('click', () => {
            if (window.innerWidth <= 768 && sidebar && backdrop) {
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
