using Newtonsoft.Json;
using RunApi.Funciones;
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
    public class PagosVentaControler
    {
        public static async Task<RespuestaCRUD_api> CRUD(PagosVenta pagosVenta, int funcion)
        {
            try
            {
                string json= JsonConvert.SerializeObject(pagosVenta);
                var url = $"PagosVenta";
                var api = new ClassAPI();
                var resp = await api.HttpWebRequestPostAsync(url,json,HttpMethod.Put,ClassDBCliente.DBCliente);
                var respApi=JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
                return respApi;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new RespuestaCRUD_api { estado=false, idAfectado=0, mensaje=msg };
            }
        }
        public static async Task<PagosVenta> ConsultarID(int id)
        {
            try
            {
                var url = $"PagosVenta/{id}";
                var api = new ClassAPI();
                var resp=await api.HttpWebRequestPostAsync(url,null, HttpMethod.Get,ClassDBCliente.DBCliente);
                var respAPI = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                if (respAPI.estado == true)
                {
                    return JsonConvert.DeserializeObject<PagosVenta>(respAPI.data);
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
