using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_Resoluciones
    {
        public int? id { get; set; }
        public string nombreRosolucion { get; set; }
        public string prefijo { get; set; }
        public int? idResolucion { get; set; }
        public string numeroResolucion { get; set; }
        public string fechaAvilitacion { get; set; }
        public string vigencia { get; set; }
        public string desde { get; set; }
        public string hasta { get; set; }
        public string caja { get; set; }
        public int? consecutivoInicial { get; set; }
        public int? consecutivo { get; set; }
        public int? estado { get; set; }
        public string estadoText { get; set; }
        public string technical_key { get; set; }
    }

}
