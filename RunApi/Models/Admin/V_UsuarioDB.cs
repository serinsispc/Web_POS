using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Admin
{
    public class V_UsuarioDB
    {
        public int id { get; set; }
        public int idUsuario { get; set; }
        public int idDB { get; set; }
        public string nombreDB { get; set; }
        public string nombreEstablecimiento { get; set; }

        // Nuevos campos agregados:
        public int IdTipoSistema { get; set; }
        public string NombreTipoSistema { get; set; }
    }

}
