using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class v_Usuario_POS
    {
        public int? id { get; set; }
        public Guid? guidUsuario { get; set; }
        public int? idTipoUsuario { get; set; }
        public int? idEstadoAI { get; set; }
        public string nombreTipoUsuario { get; set; }
        public string nombreEstadoAi { get; set; }
        public string identificacionUsuario { get; set; }
        public string nombreUsuario { get; set; }
        public string telefonoUsuario { get; set; }
        public string cuentaUsuario { get; set; }
        public string claveUsuario { get; set; }
    }
}
