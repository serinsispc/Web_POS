using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_VentasPagosInternos
    {
        public int id { get; set; }
        public int idVenta { get; set; }
        public DateTime fechaVenta { get; set; }
        public string tipoFactura { get; set; } = string.Empty;
        public int numeroVenta { get; set; }
        public int payment_methods_id { get; set; }
        public string medioDePago { get; set; } = string.Empty;
        public int idMedioDePagointerno { get; set; }
        public string medioPagoInterno { get; set; } = string.Empty;
        public decimal valorPago { get; set; }
    }

}
