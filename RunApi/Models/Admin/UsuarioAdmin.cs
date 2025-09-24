using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Admin
{
    public class UsuarioAdmin
    {
        public int idUsuario { get; set; }
        public Guid guidUsuario { get; set; }
        public string nombreUsuario { get; set; }
        public string cedulaUsuario { get; set; }
        public string celularUsuario { get; set; }
        public string cuentaUSuario { get; set; }
        public string claveUsuario { get; set; }
        public int idTipoUSuario { get; set; }
    }
}
