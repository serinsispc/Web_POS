using RunApi.Envio;
using RunApi.Respuesta;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class ClassLogin
    {
        public static async Task<UsuarioAdminRespuesta> LoginAdmin(UsuarioAdminEnvio envio)
        {
            try
            {
                string url = "UsuariosAdmin/ConsultarUsuario";

                // Serializar el objeto a JSON
                string json = JsonSerializer.Serialize(envio);
                // Llamar a la API
                ClassAPI api = new ClassAPI();
                string respuesta = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonSerializer.Deserialize<UsuarioAdminRespuesta>(respuesta);
            }
            catch (Exception ex)
            {
                string error = ex.Message;
                return new UsuarioAdminRespuesta();
            }
        }
        public static async Task<LoginRespuesta> Login(LoginEnviar envio)
        {
            try
            {
                string url = "Login/Login";

                // Serializar el objeto a JSON
                string json = JsonSerializer.Serialize(envio);
                // Llamar a la API
                ClassAPI api = new ClassAPI();
                string respuesta = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post);
                return JsonSerializer.Deserialize<LoginRespuesta>(respuesta);
            }
            catch (Exception ex)
            {
                string error = ex.Message;
                return new LoginRespuesta();
            }
        }
    }
}
