using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class TablaMesesControler
    {
        public static async Task<List<TablaMeses>> listaMeses()
        {
            try
            {
                var aPI = new ClassAPI();
                //var json = new { dbCliente = ClassDBCliente.DBCliente };
                //string json_ = JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync($"TablaMeses/ListaMeses?nombreDB={ClassDBCliente.DBCliente}", "", HttpMethod.Post);
                return JsonSerializer.Deserialize<List<TablaMeses>>(result);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return null;
            }
        }
    }
}
