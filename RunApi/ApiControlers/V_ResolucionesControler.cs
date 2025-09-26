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
    public  class V_ResolucionesControler
    {
        public static async Task<List<V_Resoluciones>> Lista()
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new { nombreDB = ClassDBCliente.DBCliente };
                string json_ = JsonConvert.SerializeObject(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/ListaResoluciones", json_, HttpMethod.Post);
                return JsonConvert.DeserializeObject<List<V_Resoluciones>>(result);
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new List<V_Resoluciones>();
            }
        }
    }
}
