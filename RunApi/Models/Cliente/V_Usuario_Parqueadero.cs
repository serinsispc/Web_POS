using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_Usuario_Parqueadero
    {
        public int? id_Usuario { get; set; }
        public Guid? guidusuario { get; set; }
        public string identificacion_usuario { get; set; }
        public string nombre_usuario { get; set; }
        public string telefono_usuario { get; set; }
        public string cuenta_usuario { get; set; }
        public string clave_usuario { get; set; }
        public string estado_usuario { get; set; }
        public int? idTipoUsuario { get; set; }
        public string nombreTipoUsuario { get; set; }
    }
}
