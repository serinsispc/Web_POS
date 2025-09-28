using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class HistorialVentasAPI
    {
        public static async Task<RespuestaCRUD_api> EditarIdResolucion(int IdVenta,int IdResolucion)
        {
            try
            {
                var objeto = new { 
                    nombreDB=ClassDBCliente.DBCliente, 
                    idventa= IdVenta, 
                    idresolucion= IdResolucion };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"HistorialVentas/EditarIdResolucion";
                var respuesta = await api.HttpWebRequestPostAsync(url,json,HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(respuesta);
            }
            catch(Exception ex)
            {
                string error = ex.Message;
                return new RespuestaCRUD_api { estado=false, idAfectado=0, mensaje=error};
            }
        }
        public static async Task<List<V_Clientes>> ListaClientes()
        {
            try
            {
                var objeto = new
                {
                    nombreDB = ClassDBCliente.DBCliente
                };
                string json = JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"V_Clientes/Lista";
                var respuesta = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<List<V_Clientes>>(respuesta);
            }
            catch (Exception ex)
            {
                string error = ex.Message;
                return new List<V_Clientes>();
            }
        }
        public static async Task<RespuestaCRUD_api> AsociarClienteAVenta(int idventa, int idCliente)
        {
            try
            {
                var objeto = new { nombreDB = ClassDBCliente.DBCliente, idventa = idventa, idCliente = idCliente };
                string json = JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"HistorialVentas/AsociarClienteAVenta";
                var respuesta = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonConvert.DeserializeObject<RespuestaCRUD_api>(respuesta);
            }
            catch (Exception ex)
            {
                string error = ex.Message;
                return new RespuestaCRUD_api() { estado = false, idAfectado = 0, mensaje = error };
            }
        }

        public static async Task<string> ConsultarToken()
        {
            try
            {
                var objeto = new { nombreDB = ClassDBCliente.DBCliente };
                string json= JsonConvert.SerializeObject(objeto);
                var api= new ClassAPI();
                var url = $"TokenEmpresa/ConsultarToken";
                var respuesta=await api.HttpWebRequestPostAsync(url,json, HttpMethod.Post);
                return respuesta;
            }
            catch(Exception ex)
            {
                string err = ex.Message;
                return err;
            }
        }
    }
}
