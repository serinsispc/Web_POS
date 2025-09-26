using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class TablaVentas
    {
        public int? id { get; set; }
        public DateTime? fechaVenta { get; set; }
        public int? numeroVenta { get; set; }
        public decimal? descuentoVenta { get; set; }
        public decimal? efectivoVenta { get; set; }
        public decimal? cambioVenta { get; set; }
        public string estadoVenta { get; set; }
        public string numeroReferenciaPago { get; set; }
        public int? diasCredito { get; set; }
        public string observacionVenta { get; set; }
        public int? IdSede { get; set; }
        public Guid? guidVenta { get; set; }
        public decimal? abonoTarjeta { get; set; }
        public decimal? propina { get; set; }
        public decimal? abonoEfectivo { get; set; }
        public int? idMedioDePago { get; set; }
        public int? idResolucion { get; set; }
        public int? idFormaDePago { get; set; }
        public string razonDescuento { get; set; }
        public int? idBaseCaja { get; set; }
    }
}
