using Newtonsoft.Json;
using RunApi.Models.Cliente;
using RunApi.Request;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class NotaCreditoAPI
    {
        public static async Task<RespuestaCRUD_api> CRUD(CRUD_NotaCreditoRequest request)
        {
            try
            {
                string json=JsonConvert.SerializeObject(request);
                var api = new ClassAPI();
                var url = $"/NotasCredito/CRUD";
                var resp=await api.HttpWebRequestPostAsync(url, json,HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
            }
            catch (Exception ex) 
            { 
                string msg = ex.Message;
                return new RespuestaCRUD_api { estado=false, idAfectado=0, mensaje=msg};
            }
        }
    }
}
