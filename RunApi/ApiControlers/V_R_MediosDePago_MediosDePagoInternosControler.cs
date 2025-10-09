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
    public class V_R_MediosDePago_MediosDePagoInternosControler
    {
        public static async Task<List<V_R_MediosDePago_MediosDePagoInternos>> Lista()
        {
            try
            {
                var api = new ClassAPI();
                var url = $"V_R_MediosDePago_MediosDePagoInternos";
                var resp = await api.HttpWebRequestPostAsync(url, null, HttpMethod.Get,ClassDBCliente.DBCliente);
                var respApi = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                if (respApi.estado == true)
                {
                    return JsonConvert.DeserializeObject<List<V_R_MediosDePago_MediosDePagoInternos>>(respApi.data);
                }
                else
                {
                    return null;
                }
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return null;
            }
        }
    }
}
