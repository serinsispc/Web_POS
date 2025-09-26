using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class ResolucionControler
    {
        public static async Task<Resolucion> ConsultarIdResolucion(int idres)
        {
            try
            {
                var aPI = new ClassAPI();
                var json = new { nombreDB = ClassDBCliente.DBCliente, idResolucion= idres };
                string json_ = JsonSerializer.Serialize(json);
                string result = await aPI.HttpWebRequestPostAsync("HistorialVentas/ConsultarResolucionIdResolucion", json_, HttpMethod.Post);
                return JsonSerializer.Deserialize<Resolucion>(result);
            }
            catch (Exception ex)
            {
                string msg = ex.Message;
                return new Resolucion();
            }
        }
    }
}
