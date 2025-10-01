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
        public AlertModerno AlertModerno { get; set; }
    }
    public class AlertModerno
    {
        public bool mostrar { get; set; } = false;
        public string titulo {  get; set; }
        public string mensaje { get; set; }
        public string tipoAlert { get; set; }
        public static AlertModerno CargarAlert(bool mostrar,string titulo,string mensaje, string tipoAlert)
        {
            return new AlertModerno { mostrar = mostrar, titulo = titulo, mensaje = mensaje, tipoAlert = tipoAlert };
        }
    }
}