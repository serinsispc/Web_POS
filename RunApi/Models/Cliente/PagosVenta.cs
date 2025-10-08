using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class PagosVenta
    {
        public int id { get; set; }
        public int idVenta { get; set; }
        public int idMedioDePagointerno { get; set; }
        public decimal valorPago { get; set; }
        public int payment_methods_id { get; set; }
    }
}
