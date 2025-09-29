using Newtonsoft.Json;
using RunApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class FacturaElectronicaJSONAPI
    {
        public static async Task<RespuestaCRUD_api> InsertInto(string json)
        {
            try
            {
                var api = new ClassAPI();
                var url = $"FacturaElectronicaJSON/InsertInto";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return new RespuestaCRUD_api() { estado=false, idAfectado=0, mensaje=msg };
            }
        }
    }
}
