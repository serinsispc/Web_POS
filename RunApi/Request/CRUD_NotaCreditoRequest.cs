using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Request
{
    public class CRUD_NotaCreditoRequest
    {
        public string nombreDB { get; set; }
        public int funcion { get; set; }
        public NotasCredito NotasCredito { get; set; }
    }
}
