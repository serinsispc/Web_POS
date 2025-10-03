using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente.TuProyecto.Models;
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
        public static async Task<V_VentasPagosInternos> ConsultarIdVenta(int idventa)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idventa=idventa };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"V_VentasPagosInternos/ConsultarIdVenta";
                var resp=await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                var respAPI = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                if (respAPI != null) 
                {
                    if (respAPI.data != null)
                    {
                        return JsonConvert.DeserializeObject<V_VentasPagosInternos>(respAPI.data);
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
