using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebCliente.ViewModels
{
    public class HistorialVentasViewModels
    {
        public DateTime Fecha1 { get; set; }
        public DateTime Fecha2 { get; set; }
        public string NumeroFactura { get; set; }
        public string NombreCliente { get; set; }
        public List<V_TablaVentas> V_TablaVentas {  get; set; }
    }
}