using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class V_CorreosClienteControler
    {
        public static async Task<List<V_CorreosCliente>> ListaIdCliente(int IdCliente)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idcliente=IdCliente };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"V_CorreosCliente/ListaIdCliente";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<List<V_CorreosCliente>>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return null;
            }
        }
    }
}
