using RunApi.Models.Admin;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Respuesta
{
    public class LoginRespuesta
    {
        public string dbCliente { get; set; }
        public v_Usuario_POS v_Usuario { get; set; }
        public V_Usuario_Parqueadero V_Usuario_Parqueadero { get; set; }
    }


}
