using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Envio
{
    public class FacturaElectronicaEnvio
    {
        public string nombreDB {  get; set; }
        public int Funcion {  get; set; }
        public FacturaElectronica facturaElectronica { get; set; }
    }
}
