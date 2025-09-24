function cargarCarrito() {
  const carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  const tbody = document.getElementById("carrito-items");
  const totalCarrito = document.getElementById("total-carrito");
  tbody.innerHTML = "";
  let total = 0;

  carrito.forEach((producto, index) => {
    const tr = document.createElement("tr");
    const precioNum = parseInt(producto.precio.replace(/[^\d]/g, '')) || 0;
    total += precioNum;

    tr.innerHTML = `
      <td>${producto.titulo}</td>
      <td>${producto.precio}</td>
      <td><button class="btn btn-sm btn-danger" onclick="eliminarProducto(${index})"><i class="bi bi-trash"></i></button></td>
    `;
    tbody.appendChild(tr);
  });

  totalCarrito.innerText = `$${total.toLocaleString("es-CO")}`;
}

function eliminarProducto(index) {
  let carrito = JSON.parse(localStorage.getItem("carrito")) || [];
  carrito.splice(index, 1);
  localStorage.setItem("carrito", JSON.stringify(carrito));
  cargarCarrito();
}

function vaciarCarrito() {
  localStorage.removeItem("carrito");
  cargarCarrito();
}

document.addEventListener("DOMContentLoaded", cargarCarrito);
