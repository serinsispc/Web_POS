using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class SedeControler
    {
        public static async Task<Sede> Sede_()
        {
            try
            {
                var json = new { dbCliente = ClassDBCliente.DBCliente};
                string json_=JsonSerializer.Serialize(json);
                ClassAPI classAPI = new ClassAPI();
                string respuesta = await classAPI.HttpWebRequestPostAsync("Sede/ConsultarSede", json_, HttpMethod.Post);

                Sede sede = JsonSerializer.Deserialize<Sede>(respuesta);
                return sede;
            }
            catch (Exception ex) 
            { 
                string message = ex.Message;
                return new Sede();
            }
        }
    }
}
