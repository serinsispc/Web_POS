using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class ExportarExcel
    {
        public int id { get; set; }
        public DateTime fechaVenta { get; set; }
        public string tipoFactura { get; set; } = string.Empty;
        public string prefijo { get; set; } = string.Empty;
        public string numeroVenta { get; set; } = string.Empty;  // puede tener ceros a la izquierda
        public string nit { get; set; } = string.Empty;          // puede tener ceros a la izquierda
        public string nombreCliente { get; set; } = string.Empty;
        public decimal IVA { get; set; }
        public decimal totalVenta { get; set; }
        public decimal propina { get; set; }
        public string estadoFE { get; set; } = string.Empty;
        public string cufe { get; set; } = string.Empty;
    }
}
