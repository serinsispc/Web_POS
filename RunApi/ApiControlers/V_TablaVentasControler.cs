using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class V_TablaVentasControler
    {
        public static async Task<List<V_TablaVentas>> Filtrar(string db, DateTime fecha1, DateTime fecha2)
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new
                {
                    nombreDB = db,
                    tabla = $"dbo.V_TablaVentas",
                    columna = "fechaVenta",
                    fecha1 = fecha1,
                    fecha2 = fecha2
                };
                string json_ = System.Text.Json.JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/FiltroDias", json_, HttpMethod.Post);
                // s = el texto que pegaste (comillas, \r\n, etc.)
                string rawArray = JsonConvert.DeserializeObject<string>(result); // 1) des-escapa la cadena → queda "[{...}, {...}]"
                var ventas = JsonConvert.DeserializeObject<List<V_TablaVentas>>(rawArray); // 2) parsea el array
                return ventas;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new List<V_TablaVentas>();
            }
        }

        public static async Task<List<V_TablaVentas>> FiltrarNumeroFactura(string db,int numero)
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new
                {
                    nombreDB = db,
                    numeroFactura = numero
                };
                string json_ = System.Text.Json.JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/FiltroNumeroFactura", json_, HttpMethod.Post);
      
                var ventas = JsonConvert.DeserializeObject<List<V_TablaVentas>>(result); // 2) parsea el array
                return ventas;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new List<V_TablaVentas>();
            }
        }

        public static async Task<List<V_TablaVentas>> FiltrarNombreCliente(string db, string NombreCliente)
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new
                {
                    nombreDB = db,
                    nombreCliente = NombreCliente
                };
                string json_ = System.Text.Json.JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/FiltrarNombreCliente", json_, HttpMethod.Post);

                var ventas = JsonConvert.DeserializeObject<List<V_TablaVentas>>(result); // 2) parsea el array
                return ventas;
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new List<V_TablaVentas>();
            }
        }
    }
}
