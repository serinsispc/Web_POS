using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using static RunApi.API_DIAN.Request.NotaCreditoRequest;

namespace RunApi.API_DIAN.Respons
{
    public class NotaCreditoResponse
    {
        public bool? is_valid { get; set; }
        public object is_restored { get; set; }
        public object algorithm { get; set; }
        public string number { get; set; }
        public object uuid { get; set; }
        public object issue_date { get; set; }
        public object expedition_date { get; set; }
        public object zip_key { get; set; }
        public string status_code { get; set; }
        public string status_description { get; set; }
        public string status_message { get; set; }
        public object mail_sending_message { get; set; }
        public List<string> errors_messages { get; set; }
        public object xml_name { get; set; }
        public object zip_name { get; set; }
        public object signature { get; set; }
        public object qr_code { get; set; }
        public object qr_data { get; set; }
        public object qr_link { get; set; }
        public object pdf_download_link { get; set; }
        public object xml_base64_bytes { get; set; }
        public object application_response_base64_bytes { get; set; }
        public object attached_document_base64_bytes { get; set; }
        public object pdf_base64_bytes { get; set; }
        public object zip_base64_bytes { get; set; }
        public int type_environment_id { get; set; }
        public Payload payload { get; set; }
    }
    public class discrepancy_response
    {
        public int correction_concept_id { get; set; }
    }
    public class customer
    {
        public string identification_number { get; set; }
        public string name { get; set; }
        public string phone { get; set; }
        public int municipality_id { get; set; }
        public string address { get; set; }
        public string email { get; set; }
        public string merchant_registration { get; set; }
    }
    public class legalMonetaryTotals
    {
        public string line_extension_amount { get; set; }
        public string tax_exclusive_amount { get; set; }
        public string tax_inclusive_amount { get; set; }
        public string payable_amount { get; set; }
    }
    public class taxTotal
    {
        public int tax_id { get; set; }
        public string tax_amount { get; set; }
        public string taxable_amount { get; set; }
        public string percent { get; set; }
        public object unit_measure_id { get; set; }
        public object per_unit_amount { get; set; }
        public object base_unit_measure { get; set; }
    }
    public class credit_note_lines
    {
        public int unit_measure_id { get; set; }
        public string invoiced_quantity { get; set; }
        public string line_extension_amount { get; set; }
        public List<TaxTotal> tax_totals { get; set; }
        public string description { get; set; }
        public string code { get; set; }
        public int type_item_identification_id { get; set; }
        public string price_amount { get; set; }
        public string base_quantity { get; set; }
        public object reference_price_id { get; set; }
        public object free_of_charge_indicator { get; set; }
    }
    public class billing_reference
    {
        public string number { get; set; }
        public string uuid { get; set; }
        public string issue_date { get; set; }
    }
    public class payload
    {
        public string testSetID { get; set; }
        public string number { get; set; }
        //public bool sync { get; set; }
        public int type_document_id { get; set; }
        public Customer customer { get; set; }
        public LegalMonetaryTotals legal_monetary_totals { get; set; }
        public List<credit_note_lines> credit_note_lines { get; set; }
        public Discrepancy_response discrepancy_response { get; set; }
        public Billing_reference billing_reference { get; set; }
        public object tax_totals { get; set; }
        public string token { get; set; }

    }
}
