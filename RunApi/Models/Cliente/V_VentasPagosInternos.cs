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
        public DateTime? fechaVenta { get; set; }
        public string tipoFactura { get; set; }
        public int numeroVenta { get; set; }
        public string medioDePago { get; set; }
        public int? idBaseCaja { get; set; }
        public string numeroReferenciaPago { get; set; }
        public int idMedioDePagointerno { get; set; }
        public string medioPagoInterno { get; set; }
        public decimal valorPago { get; set; }
    }

}
