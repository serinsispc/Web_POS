using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class FacturaElectronica
    {
        public int id { get; set; }
        public int idVenta { get; set; }
        public string cufe { get; set; }
        public string numeroFactura { get; set; }
        public string fechaEmision { get; set; }
        public string fecahVensimiento { get; set; }
        public string dataQR { get; set; }
        public string imagenQR { get; set; }
        public int resolucion_id { get; set; }
        public string prefijo { get; set; }
        public int numero_factura { get; set; }
    }
}
