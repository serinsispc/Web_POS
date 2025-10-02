using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class NotasCredito
    {
        public int id { get; set; }
        public int idVenta { get; set; }
        public string cufe { get; set; } = string.Empty;
        public string numeroFactura { get; set; } = string.Empty;
        public string fechaEmision { get; set; } = string.Empty;
        public string fecahVensimiento { get; set; } = string.Empty;
        public string dataQR { get; set; } = string.Empty;
        public string imagenQR { get; set; } = string.Empty;
    }
}
