using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class Resolucion
    {
        public int? id { get; set; }                     // PK (IDENTITY)
        public string nombreRosolucion { get; set; }     // se conserva el nombre original usado en tu JSON
        public int? idResolucion { get; set; }           // id externo/DIAN si aplica
        public string prefijo { get; set; }
        public string numeroResolucion { get; set; }
        public string fechaAvilitacion { get; set; }     // se conserva tal cual
        public string desde { get; set; }
        public string vigencia { get; set; }
        public string caja { get; set; }
        public int? consecutivoInicial { get; set; }
        public string hasta { get; set; }
        public int? estado { get; set; }                 // 1=ACTIVA, 0=INACTIVA
        public string technical_key { get; set; }
    }
}
