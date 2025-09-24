using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_TablaVentas
    {
        public int? id { get; set; }
        public DateTime? fechaVenta { get; set; }
        public string tipoFactura { get; set; }
        public string prefijo { get; set; }
        public int? numeroVenta { get; set; }
        public int? descuentoVenta { get; set; }
        public int? idMedioDePago { get; set; }
        public int? idResolucion { get; set; }
        public int? idFormaDePago { get; set; }
        public decimal? subtotalVenta { get; set; }
        public decimal? basesIva { get; set; }
        public decimal? basesIva_5 { get; set; }
        public decimal? basesIva_19 { get; set; }
        public decimal? IVA { get; set; }
        public decimal? IVA_5 { get; set; }
        public decimal? IVA_19 { get; set; }
        public decimal? INC { get; set; }
        public decimal? INCBolsas { get; set; }
        public decimal? otrosImpuestos { get; set; }
        public decimal? ivaVenta { get; set; }
        public decimal? totalVenta { get; set; }
        public decimal? total_A_Pagar { get; set; }
        public decimal? efectivoVenta { get; set; }
        public decimal? cambioVenta { get; set; }
        public string formaDePago { get; set; }
        public decimal? abonoEfectivo { get; set; }
        public decimal? abonoTarjeta { get; set; }
        public decimal? totalPagadoVenta { get; set; }
        public decimal? totalPendienteVenta { get; set; }
        public string estadoVenta { get; set; }
        public string medioDePago { get; set; }
        public string numeroReferenciaPago { get; set; }
        public int? diasCredito { get; set; }
        public DateTime? fechaVencimiento { get; set; }
        public string observacionVenta { get; set; }
        public int? IdSede { get; set; }
        public Guid? guidVenta { get; set; }
        public decimal? costoTotalVenta { get; set; }
        public decimal? utilidadTotalVenta { get; set; }
        public int? idCliente { get; set; }
        public string nit { get; set; }
        public string nombreCliente { get; set; }
        public decimal? propina { get; set; }
        public string cufe { get; set; }
        public string imagenQR { get; set; }
        public int? idBaseCaja { get; set; }
        public string razonDescuento { get; set; }
    }

}
