using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class ConfiguracionDian
    {
        public int? id { get; set; }
        public int? idAnbiente { get; set; }
        public string token { get; set; }
        public string textSetID { get; set; }
        public string razonSocial { get; set; }
        public string nombreComercial { get; set; }
        public string nit { get; set; }
        public int? idTipoContribuyente { get; set; }
        public int? idRegiman { get; set; }
        public string direccion { get; set; }
        public string telefono { get; set; }
        public string correo { get; set; }
        public string testSetID_POS { get; set; }
    }

}
