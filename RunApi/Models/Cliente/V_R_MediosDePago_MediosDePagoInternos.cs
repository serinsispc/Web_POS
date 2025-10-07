using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_R_MediosDePago_MediosDePagoInternos
    {
        public int idRMPI {  get; set; }
        public int idMedioDePago { get; set; }
        public int idMediosDePagoInternos { get; set; }
        public string nombreRMPI { get; set; }
        public string reporteRDIAN { get; set; }
        public int resporeDian { get; set; }
    }
}
