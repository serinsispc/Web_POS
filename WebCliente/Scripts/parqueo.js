document.addEventListener("DOMContentLoaded", function () {
    const obsTextarea = document.getElementById("observacion");
    const obsContainer = document.getElementById("observacionContainer");
    const toggleBtn = document.getElementById("toggleObservacionBtn");
    const iconObservacion = document.getElementById("iconObservacion");
    const inputPlaca = document.querySelector(".input-placa");

    // ✅ Enfocar input de placa al cargar
    inputPlaca?.focus();

    // Acordeón observación
    toggleBtn?.addEventListener("click", function () {
        const visible = obsContainer.style.display === "block";
        obsContainer.style.display = visible ? "none" : "block";
        iconObservacion.classList.toggle("bi-chevron-down", visible);
        iconObservacion.classList.toggle("bi-chevron-up", !visible);
        if (!visible) obsTextarea.focus();
    });

    function verificarObservacion() {
        const isMobile = window.innerWidth <= 768;
        const estaVacia = obsTextarea.value.trim() === "";
        if (isMobile && estaVacia) {
            obsContainer.style.display = "none";
            iconObservacion.classList.add("bi-chevron-down");
            iconObservacion.classList.remove("bi-chevron-up");
        }
    }

    window.addEventListener("resize", verificarObservacion);
    obsTextarea.addEventListener("input", verificarObservacion);
    verificarObservacion();

    // ✅ Resaltar botón visualmente
    function resaltarBoton(boton) {
        if (!boton) return;
        boton.classList.add("tecla-activa");
        setTimeout(() => boton.classList.remove("tecla-activa"), 300);
    }

    // ✅ Mostrar alerta moderna al hacer clic o presionar tecla
    function mostrarAlerta(mensaje) {
        if (typeof Swal !== "undefined") {
            Swal.fire({
                icon: "info",
                title: "Botón activado",
                text: mensaje,
                timer: 1500,
                showConfirmButton: false
            });
        } else {
            alert(mensaje);
        }
    }

    // ✅ Asignar alertas a botones por click directo
    const botonesConTecla = [
        { texto: "MOTO", mensaje: "F1 - MOTO" },
        { texto: "AUTOMÓVIL", mensaje: "F2 - AUTOMÓVIL" },
        { texto: "CAMIONETA", mensaje: "F3 - CAMIONETA" },
        { texto: "CAMIÓN", mensaje: "F4 - CAMIÓN" },
        { texto: "F9", mensaje: "F9 - Tarifa Especial" },
        { texto: "Parqueados", mensaje: "F10 - Parqueados" },
        { texto: "Historial", mensaje: "F11 - Historial" },
        { texto: "Descuento", mensaje: "F12 - Descuento" }
    ];

    botonesConTecla.forEach(info => {
        const btn = querySelectorContains("button", info.texto);
        if (btn) {
            btn.addEventListener("click", () => {
                resaltarBoton(btn);
                mostrarAlerta(info.mensaje);
            });
        }
    });

    // 🔑 Teclas de acceso rápido
    document.addEventListener("keydown", function (event) {
        let boton = null;
        let mensaje = "";
        switch (event.code) {
            case "F1":
                event.preventDefault();
                boton = querySelectorContains("button", "MOTO");
                mensaje = "F1 - MOTO";
                break;
            case "F2":
                event.preventDefault();
                boton = querySelectorContains("button", "AUTOMÓVIL");
                mensaje = "F2 - AUTOMÓVIL";
                break;
            case "F3":
                event.preventDefault();
                boton = querySelectorContains("button", "CAMIONETA");
                mensaje = "F3 - CAMIONETA";
                break;
            case "F4":
                event.preventDefault();
                boton = querySelectorContains("button", "CAMIÓN");
                mensaje = "F4 - CAMIÓN";
                break;
            case "F9":
                event.preventDefault();
                boton = querySelectorContains("button", "F9");
                mensaje = "F9 - Tarifa Especial";
                break;
            case "F10":
                event.preventDefault();
                boton = querySelectorContains("button", "Parqueados");
                mensaje = "F10 - Parqueados";
                break;
            case "F11":
                event.preventDefault();
                boton = querySelectorContains("button", "Historial");
                mensaje = "F11 - Historial";
                break;
            case "F12":
                event.preventDefault();
                boton = querySelectorContains("button", "Descuento");
                mensaje = "F12 - Descuento";
                break;
            case "Escape":
                event.preventDefault();
                location.reload();
                return;
        }

        if (boton) {
            boton.click();
            resaltarBoton(boton);
            mostrarAlerta(mensaje);
        }
    });

    // Polyfill para :contains
    (function () {
        if (!Element.prototype.matches) {
            Element.prototype.matches = Element.prototype.msMatchesSelector || Element.prototype.webkitMatchesSelector;
        }
        if (!Element.prototype.closest) {
            Element.prototype.closest = function (s) {
                let el = this;
                do {
                    if (el.matches(s)) return el;
                    el = el.parentElement || el.parentNode;
                } while (el !== null && el.nodeType === 1);
                return null;
            };
        }
        if (!String.prototype.contains) {
            String.prototype.contains = function (str) {
                return this.indexOf(str) !== -1;
            };
        }
    })();

    function querySelectorContains(selector, text) {
        const elements = document.querySelectorAll(selector);
        for (const el of elements) {
            if (el.textContent.trim().includes(text)) {
                return el;
            }
        }
        return null;
    }

    document.querySelector = function (selector) {
        if (selector.includes(":contains(")) {
            const match = selector.match(/(.*):contains\(['"](.+)['"]\)/);
            if (match) {
                return querySelectorContains(match[1], match[2]);
            }
        }
        return document.querySelectorAll(selector)[0];
    };
});


// Mostrar el botón al hacer scroll
window.addEventListener('scroll', function () {
    const btn = document.getElementById('botonFlotante');
    if (window.scrollY > 100) {
        btn.style.display = 'flex';
    } else {
        btn.style.display = 'none';
    }
});

// Al hacer clic, volver arriba
document.getElementById('botonFlotante').addEventListener('click', function (e) {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
});

document.getElementById("formPlaca").addEventListener("submit", function (e) {
    const placa = document.getElementById("placa").value.trim();
    if (placa === "") {
        e.preventDefault(); // Cancela el envío si está vacío
    }
});

// También puedes permitir envío al presionar Enter solo si hay valor
document.getElementById("placa").addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        const valor = this.value.trim();
        if (valor === "") {
            e.preventDefault(); // Cancela el Enter si el campo está vacío
        }
    }
});