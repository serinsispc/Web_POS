using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using RunApi.Respons;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class payment_methodsControler
    {
        public static async Task<List<payment_methods>> Lista_payment()
        {
            try
            {
                var api = new ClassAPI();
                var objeto = new { nombreDB=ClassDBCliente.DBCliente };
                string json=JsonConvert.SerializeObject(objeto);
                var url = $"payment_methods/Lista_payment";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                var respApi = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                if (respApi.estado == true)
                {
                    return JsonConvert.DeserializeObject<List<payment_methods>>(respApi.data);
                }
                else
                {
                    return null;
                }
            }
            catch(Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }
    }
}
