using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebCliente.ViewModels
{
    public class MediosDePagoViewModels
    {
        public List<V_VentasPagosInternos> V_VentasPagosInternos { get; set; }
        public List<payment_methods> PaymentMethods { get; set; }
        public List<V_R_MediosDePago_MediosDePagoInternos> V_R_MediosDePagosInternos { get;  set; }
    }
}