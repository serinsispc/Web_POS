using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class Sede
    {
        public int? id { get; set; }
        public string nombreSede { get; set; }
        public string nit { get; set; }
        public string regimen { get; set; }
        public string telefono { get; set; }
        public string celular { get; set; }
        public string direccion { get; set; }
        public string reprecentante { get; set; }
        public string nombre_impresora { get; set; }
        public string tipoImpresora { get; set; }
        public int? tamanoPapel { get; set; }
        public string horarios_atencion { get; set; }
        public string cajon_monedero { get; set; }
        public string idWhatsAppMeta { get; set; }
        public string rutaComanda { get; set; }
        public int? id_tipoCaja { get; set; }
        public int? idEmpresa { get; set; }
        public string codigoCajon { get; set; }
        public string correoAdmin1 { get; set; }
        public string leyenda2 { get; set; }
        public string tiendaOnline { get; set; }
        public int? codigoImpresora { get; set; }
        public string leyenda1 { get; set; }
        public string impresora { get; set; }
        public int? cortePapel { get; set; }
        public int? aperturaCajon { get; set; }
        public int? editarPrecioVentaProducto { get; set; }
        public int? ventasEnNegativo { get; set; }
        public string impresora2 { get; set; }
        public int? Gramera { get; set; }
        public Guid? guidSede { get; set; }
    }

}
