using RunApi.Models.Admin;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Respuesta
{
    public class UsuarioAdminRespuesta
    {
        public UsuarioAdmin usuarioAdmin { get; set; }
        public List<V_UsuarioDB> v_UsuarioDB { get; set; }
    }





}
