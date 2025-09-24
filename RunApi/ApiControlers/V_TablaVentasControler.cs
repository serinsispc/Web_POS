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
        public static async Task<List<V_TablaVentas>> FiltrarDIA()
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new
                {
                    basedb = "DB_STRAGOS_CLUB_SAS",
                    tabla = "dbo.V_TablaVentas",
                    columna = "fechaVenta",
                    fecha = "2025-09-23"
                };
                string json_ = System.Text.Json.JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/FiltroDia", json_, HttpMethod.Post);
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
    }
}
