using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class V_Clientes
    {
        public int id { get; set; }
        public int typeDocumentIdentification_id { get; set; }
        public string nameTypeDocumentoIdentification { get; set; }
        public int typeOrganization_id { get; set; }
        public string nameTypeOrganization { get; set; }
        public int municipality_id { get; set; }
        public string nameMunicipality { get; set; }
        public int typeRegime_id { get; set; }
        public string nameTypeRegime { get; set; }
        public int typeLiability_id { get; set; }
        public string nameTypeLiability { get; set; }
        public int typeTaxDetail_id { get; set; }
        public string nameTaxDetail { get; set; }
        public string nameCliente { get; set; }
        public string tradeName { get; set; }
        public string phone { get; set; }
        public string adress { get; set; }
        public string email { get; set; }
        public string merchantRegistration { get; set; }
        public string identificationNumber { get; set; }
        public int idTipoTercero { get; set; }
    }
}
