using Newtonsoft.Json;
using RunApi.Envio;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.Remoting;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class FacturaElectronicaAPI
    {
        public static async Task<int> ConcecutivoFE(int idResolcuoin)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idresolucion=idResolcuoin };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"FacturaElectronica/ConsultarConsecutivo";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<int>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return 0;
            }
        }
        public static async Task<RespuestaCRUD_api> CRUD(FacturaElectronicaEnvio envio)
        {
            try
            {
                string json = JsonConvert.SerializeObject(envio);
                var api= new ClassAPI();
                var url = $"FacturaElectronica/CRUD";
                var resp=await api.HttpWebRequestPostAsync(url,json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(resp);
            }
            catch(Exception ex)
            {
                string error = ex.Message;
                return new RespuestaCRUD_api { estado=false, idAfectado=0, mensaje=error };
            }
        }
        public static async Task<FacturaElectronica>ConsultarCufe(string json)
        {
            try
            {
               
                var api=new ClassAPI();
                var url = $"FacturaElectronica/ConsultarCufe";
                var resp=await api.HttpWebRequestPostAsync(url,json,HttpMethod.Post);
                return JsonConvert.DeserializeObject<FacturaElectronica>(resp);
            }
            catch(Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }
        public static async Task<FacturaElectronica> ConsultarIdVenta(string json)
        {
            try
            {

                var api = new ClassAPI();
                var url = $"FacturaElectronica/ConsultarIdVenta";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<FacturaElectronica>(resp);
            }
            catch (Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }
    }
}
