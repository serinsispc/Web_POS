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
        public static async Task<FacturaElectronicaJSON> ConsultarIdVenta(int idventa)
        {
            try
            {
                var api = new ClassAPI();
                var url = $"FacturaElectronicaJSON/{idventa}";
                var resp = await api.HttpWebRequestPostAsync(url, null, HttpMethod.Get,ClassDBCliente.DBCliente);
                if (resp != null) 
                {
                    return JsonConvert.DeserializeObject<FacturaElectronicaJSON>(resp);
                }
                else
                {
                    return null;
                }
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return null;
            }
        }
    }
}
