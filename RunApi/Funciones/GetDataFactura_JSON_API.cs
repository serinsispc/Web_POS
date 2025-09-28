using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class GetDataFactura_JSON_API
    {
        public static async Task<GetDataFactura_JSON> DataFactura(int idVenta)
        {
            try
            {
                var objeto = new { nombreDB = ClassDBCliente.DBCliente, idventa = idVenta };
                string json = JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"GetDataFactura_JSON/ConsultarFactura_ID";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Get);
                return JsonConvert.DeserializeObject<GetDataFactura_JSON>(resp);
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return 0;
            }
        }
    }
}
