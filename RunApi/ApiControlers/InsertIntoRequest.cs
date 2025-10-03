using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class InsertIntoRequest
    {
        public string nombreDB { get; set; }
        public int Funcion {  get; set; }
        public FacturaElectronicaJSON FacturaElectronicaJSON { get; set; }
    }
}
