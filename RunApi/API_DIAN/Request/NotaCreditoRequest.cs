using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN.Request
{
    public class NotaCreditoRequest 
    {
        public DiscrepancyResponse discrepancy_response { get; set; }
        public BillingReference billing_reference { get; set; }
        public int number { get; set; }
        public Resolution_NC resolution { get; set; }
        public bool sync { get; set; }
        public int type_document_id { get; set; }
        public Customer_NC customer { get; set; }
        public List<AllowanceCharge_NC> allowance_charges { get; set; }
        public LegalMonetaryTotals_NC legal_monetary_totals { get; set; }
        public List<PaymentForms_NC> payment_forms { get; set; }
        public List<CreditNoteLines> credit_note_lines { get; set; }
        public List<Notas_NC> notes { get; set; }
        public TaxTotal_NC tax_totals { get; set; }

        public class Resolution_NC
        {
            public string prefix { get; set; }
            public int from { get; set; }
            public int to { get; set; }
        }
        public class DiscrepancyResponse
        {
            public int correction_concept_id { get; set; }
        }
        public class BillingReference
        {
            public string number { get; set; }
            public string uuid { get; set; }
            public string issue_date { get; set; }
        }
        public class Customer_NC
        {
            /// <summary>
            /// Documento del Cliente
            /// </summary>
            public string identification_number { get; set; }
            /// <summary>
            /// Nombres y Apellidos del Cliente
            /// </summary>
            public string name { get; set; }
            /// <summary>
            /// Telefono del Cliente O Razon social del empresa
            /// </summary>
            public string phone { get; set; }
            /// <summary>
            /// ID Municipio Residencia del Cliente
            /// </summary>
            public int municipality_id { get; set; }
            /// <summary>
            /// Dirección del Cliente
            /// </summary>
            public string address { get; set; }
            /// <summary>
            /// Correo Electronico del Cliente, Si desea reportar varios emails usar ; como separador
            /// </summary>
            public string email { get; set; }
            /// <summary>
            /// Registro mercantil del Cliente por Default No tiene
            /// </summary>
            public string merchant_registration { get; set; }
            /// <summary>
            /// Código del tipo organización (Identificador de tipo de organización jurídica de la de persona)
            /// </summary>
            public int type_organization_id { get; set; }
            public int type_document_identification_id { get; set; }
            public string trade_name { get; set; }
        }
        public class AllowanceCharge_NC
        {
            public bool charge_indicator { get; set; }
            public int discount_id { get; set; }
            public string allowance_charge_reason { get; set; }
            public string amount { get; set; }
            public string base_amount { get; set; }
        }
        public class LegalMonetaryTotals_NC
        {
            public string line_extension_amount { get; set; }
            public string tax_exclusive_amount { get; set; }
            public string tax_inclusive_amount { get; set; }
            public string payable_amount { get; set; }
        }
        public class TaxTotal_NC
        {
            public int tax_id { get; set; }
            public string tax_amount { get; set; }
            public string taxable_amount { get; set; }
            public string percent { get; set; }
            public int? unit_measure_id { get; set; }
            public string per_unit_amount { get; set; }
            public string base_unit_measure { get; set; }
        }
        public class CreditNoteLines
        {
            public int unit_measure_id { get; set; }
            public string invoiced_quantity { get; set; }
            public string line_extension_amount { get; set; }
            public List<AllowanceCharge> allowance_charges { get; set; }
            public List<TaxTotal> tax_totals { get; set; }
            public string description { get; set; }
            public string code { get; set; }
            public int type_item_identification_id { get; set; }
            public string price_amount { get; set; }
            public string base_quantity { get; set; }
        }
        public class Notas_NC
        {
            public string text { get; set; }
        }
        public class PaymentForms_NC
        {
            public int payment_form_id { get; set; }
            public int payment_method_id { get; set; }
            public string payment_due_date { get; set; }
            public int duration_measure { get; set; }
        }

    }
}
