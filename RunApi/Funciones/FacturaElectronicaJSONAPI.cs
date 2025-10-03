using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Respons;
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
        public static async Task<RespuestaCRUD_api> CRUD(string json)
        {
            try
            {
                var api = new ClassAPI();
                var url = $"FacturaElectronicaJSON/CRUD";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return new RespuestaCRUD_api() { estado=false, idAfectado=0, mensaje=msg };
            }
        }
        public static async Task<RespuestaAPI> ConsultarIdVenta(int idventa)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idventa=idventa };
                string json= JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"FacturaElectronicaJSON/ConsultarIdVenta";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaAPI>(resp);
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new RespuestaAPI() { estado = false, mensaje = msg, data=null };
            }
        }
    }
}
