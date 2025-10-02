using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Respons;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class TablaVentaAPI
    {
        public static async Task<bool> AgregarObservacion(int idventa,string observacion)
        {
            try
            {
                var objeto = new {
                    nombreDB=ClassDBCliente.DBCliente,
                    observacion=observacion,
                    idventa=idventa
                };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"TablaVenta/AgregarObservicio";
                var resp=await api.HttpWebRequestPostAsync(url, json,HttpMethod.Put);
                return JsonConvert.DeserializeObject<bool>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return false;
            }
        }

        public static async Task<bool> EditarConsecutivo(int idventa, int consecutivo)
        {
            try
            {
                var objeto = new
                {
                    nombreDB = ClassDBCliente.DBCliente,
                    consecutivo = consecutivo,
                    idventa = idventa
                };
                string json = JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"TablaVenta/EditarConsecutivo";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Put);
                var respapi = JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
                return respapi.estado;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return false;
            }
        }
        public static async Task<bool> EditarEstadoFactura(int idventa, string estado)
        {
            try
            {
                var objeto = new
                {
                    nombreDB = ClassDBCliente.DBCliente,
                    estado = estado,
                    idventa = idventa
                };
                string json = JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"TablaVenta/EditarEstadoFactura";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                var respapi = JsonConvert.DeserializeObject<RespuestaAPI>(resp);
                return respapi.estado;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return false;
            }
        }
    }
}
