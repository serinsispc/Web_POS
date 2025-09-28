using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN
{
    public class ConsultarNIT_Respons
    {
        [JsonProperty("message")]
        public string Message { get; set; }

        [JsonProperty("email")]
        public string Email { get; set; } = string.Empty;

        [JsonProperty("name")]
        public string Name { get; set; } = string.Empty;
    }
}
