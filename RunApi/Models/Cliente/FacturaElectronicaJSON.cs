using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Models.Cliente
{
    public class FacturaElectronicaJSON
    {
        public int id { get; set; }
        public int idventa { get; set; }
        public bool is_valid { get; set; }
        public bool is_restored { get; set; }
        public string algorithm { get; set; } = string.Empty;
        public string zip_key { get; set; } = string.Empty;
        public string status_code { get; set; } = string.Empty;
        public string status_description { get; set; } = string.Empty;
        public string status_message { get; set; } = string.Empty;
        public string mail_sending_message { get; set; } = string.Empty;
        public string errors_messages { get; set; } = string.Empty;
        public string xml_name { get; set; } = string.Empty;
        public string zip_name { get; set; } = string.Empty;
        public string signature { get; set; } = string.Empty;
        public string qr_code { get; set; } = string.Empty;
        public string qr_link { get; set; } = string.Empty;
        public string pdf_download_link { get; set; } = string.Empty;
        public string xml_base64_bytes { get; set; } = string.Empty;
        public string application_response_base64_bytes { get; set; } = string.Empty;
        public string attached_document_base64_bytes { get; set; } = string.Empty;
        public string pdf_base64_bytes { get; set; } = string.Empty;
        public string zip_base64_bytes { get; set; } = string.Empty;
        public int type_environment_id { get; set; }
    }
}
