using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class GetDataFactura_JSON
    {
        // En tu JSON 'estado' viene como 1/0. Puedes dejarlo int o usar un converter para bool.
        public int estado { get; set; }

        // En el JSON viene como OBJETO (no arreglo)
        public V_TablaVentas V_TablaVentas { get; set; }

        // En el JSON viene como ARREGLO (sí es lista)
        public List<V_DetalleCaja> V_DetalleCaja { get; set; }

        // En el JSON viene como OBJETO (no arreglo)
        public V_Clientes V_Clientes { get; set; }

        public string mensaje { get; set; }
    }
}
