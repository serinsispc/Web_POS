using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_DetalleCaja
    {
        public int? id { get; set; }
        public Guid? guidDetalle { get; set; }
        public int? idVenta { get; set; }
        public int? idPresentacion { get; set; }
        public string codigoProducto { get; set; }
        public string nombreProducto { get; set; }
        public int? impuesto_id { get; set; }
        public string presentacion { get; set; }
        public decimal? unidad { get; set; }
        public decimal? preVentaNeto { get; set; }
        public decimal? precioVenta { get; set; }
        public decimal? descuentoDetalle { get; set; }
        public decimal? porImpuesto { get; set; }
        public decimal? baseImpuesto { get; set; }
        public decimal? valorImpuesto { get; set; }
        public decimal? subTotalDetalleNeto { get; set; }
        public decimal? subTotalDetalle { get; set; }
        public decimal? totalDetalle { get; set; }
        public decimal? costoUnidad { get; set; }
        public decimal? contenido { get; set; }
        public decimal? costoTotal { get; set; }
        public string observacion { get; set; }
        public string opciones { get; set; }
        public string adiciones { get; set; }
    }
}
