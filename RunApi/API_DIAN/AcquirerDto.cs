using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN
{
    public class AcquirerDto
    {
        public string Message { get; set; }        // null => encontrado
        public string Email { get; set; } = "";
        public string Name { get; set; } = "";
        public string Nit { get; set; }           // lo agregamos para reenviar el NIT consultado
    }

}
