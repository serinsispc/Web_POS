using Newtonsoft.Json;
using RunApi.API_DIAN;
using System;
using System.Collections.Generic;
using System.Data.SqlTypes;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones.DIAN_API
{
    public class API_DIAN
    {
        public static async Task<ConsultarNIT_Respons> ConsultarNIT(ConsultarNIT_Request request, string token)
        {
            try
            {
                var api =new ClassAPI();
                string json=JsonConvert.SerializeObject(request);
                var url = $"/api/ubl2.1/status/acquirer";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post, true, token.Replace("\"",""));
                return JsonConvert.DeserializeObject<ConsultarNIT_Respons>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return new ConsultarNIT_Respons() { Message = msg };
            }
        }
    }
}
