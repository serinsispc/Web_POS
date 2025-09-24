    const toggleBtn = document.getElementById('toggleMenuBtn');
    const menuLateral = document.getElementById('menuLateral');

    toggleBtn?.addEventListener('click', () => {
      menuLateral.classList.toggle('mostrar');
    });

    document.addEventListener('click', (e) => {
      if (window.innerWidth <= 768 && menuLateral.classList.contains('mostrar')) {
        if (!menuLateral.contains(e.target) && e.target !== toggleBtn && !toggleBtn.contains(e.target)) {
          menuLateral.classList.remove('mostrar');
        }
      }
    });