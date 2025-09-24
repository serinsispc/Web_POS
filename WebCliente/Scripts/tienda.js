document.addEventListener("DOMContentLoaded", function () {
  const inputBuscador = document.getElementById("buscador");
  const contenedor = document.querySelector("#tienda .row");

  if (inputBuscador) {
    inputBuscador.addEventListener("keyup", function () {
      const valor = inputBuscador.value.toLowerCase();
      const tarjetas = document.querySelectorAll(".card");
      tarjetas.forEach(card => {
        const titulo = card.querySelector(".card-title").innerText.toLowerCase();
        card.style.display = titulo.includes(valor) ? "block" : "none";
      });
    });
  }

  contenedor.addEventListener("click", function (e) {
    if (e.target.classList.contains("btn-demo")) {
      const card = e.target.closest(".card");
      const titulo = card.querySelector(".card-title").innerText;
      const precio = card.querySelector(".card-text").innerText;

      const producto = { titulo, precio };
      const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
      carrito.push(producto);
      localStorage.setItem("carrito", JSON.stringify(carrito));

      const toastEl = document.getElementById("toastCarrito");
      if (toastEl) {
        const toast = new bootstrap.Toast(toastEl);
        toast.show();
      }

      actualizarContadorCarrito();
    }
  });

  actualizarContadorCarrito();
});

function actualizarContadorCarrito() {
  const contador = document.getElementById("carrito-contador");
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  if (contador) contador.innerText = carrito.length;
}
