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
                var url = $"payment_methods";
                var resp = await api.HttpWebRequestPostAsync(url, null, HttpMethod.Get,ClassDBCliente.DBCliente);
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
