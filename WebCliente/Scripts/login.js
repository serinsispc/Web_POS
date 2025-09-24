document.addEventListener("DOMContentLoaded", function () {
    const inputUsuario = document.getElementById("usuario");
    const inputClave = document.getElementById("clave");
    const btnIngresar = document.querySelector("button[type='submit']");

    if (inputUsuario && inputClave && btnIngresar) {
        inputUsuario.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                inputClave.focus();
            }
        });

        inputClave.addEventListener("keydown", function (e) {
            if (e.key === "Enter") {
                e.preventDefault();
                btnIngresar.click();
            }
        });
    } else {
        console.warn("Uno o más elementos del login no se encontraron en el DOM.");
    }
});
