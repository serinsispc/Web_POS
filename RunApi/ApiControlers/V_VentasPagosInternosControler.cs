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
    public class V_VentasPagosInternosControler
    {
        public static async Task<List<V_VentasPagosInternos>> ConsultarIdVenta(int idventa)
        {
            try
            {
                var api = new ClassAPI();
                var url = $"V_VentasPagosInternos/{idventa}";
                var resp=await api.HttpWebRequestPostAsync(url, null, HttpMethod.Get, ClassDBCliente.DBCliente);
                var respAPI = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                if (respAPI != null) 
                {
                    if (respAPI.data != null)
                    {
                        return JsonConvert.DeserializeObject<List<V_VentasPagosInternos>>(respAPI.data);
                    }
                    else
                    {
                        return null;
                    }
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
