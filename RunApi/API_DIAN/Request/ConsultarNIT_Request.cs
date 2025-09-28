using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN
{
    public class ConsultarNIT_Request
    {
        [JsonProperty("environment")]
        public EnvironmentDto Environment { get; set; } = new EnvironmentDto();

        [JsonProperty("type_document_identification_id")]
        public int TypeDocumentIdentificationId { get; set; }

        [JsonProperty("identification_number")]
        public long IdentificationNumber { get; set; }
    }

    public class EnvironmentDto
    {
        [JsonProperty("type_environment_id")]
        public int TypeEnvironmentId { get; set; }
    }
}
