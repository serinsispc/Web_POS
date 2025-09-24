using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using RunApi.Respuesta;
using RunApi.Envio;
using System.Text.Json;

namespace RunApi
{
    public class ClassAPI
    {
        private readonly HttpClient _httpClient;
        //public string UrlEndPoint { get; set; } = "https://www.serinsispc.com/ApiSerinsisPC/api/";
        public string UrlEndPoint { get; set; } = "https://localhost:7004/api/";
        //public string UrlEndPoint { get; set; } = "http://localhost/Api/api/";
        public string token { get; set; } = "4007005B-3F7A-4D5B-A6E3-0711DF09FA55";

        public ClassAPI()
        {
            _httpClient = new HttpClient();
        }

        public async Task<string> HttpWebRequestPostAsync(string url, string json, HttpMethod httpMethod)
        {
            try
            {
                var request = new HttpRequestMessage(httpMethod, UrlEndPoint + url);

                request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

                if (!string.IsNullOrEmpty(token))
                {
                    request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token);
                }

                if ((httpMethod == HttpMethod.Post || httpMethod == HttpMethod.Put) && json != null)
                {
                    request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
                }

                HttpResponseMessage response = await _httpClient.SendAsync(request);

                string result = await response.Content.ReadAsStringAsync();

                return response.IsSuccessStatusCode ? result : $"Error {(int)response.StatusCode}: {result}";
            }
            catch (Exception ex)
            {
                return $"Excepción: {ex.Message}";
            }
        }

        public async Task<UsuarioAdminRespuesta> LoginAdmin(UsuarioAdminEnvio envio)
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
            catch(Exception ex)
            {
                string error = ex.Message;
                return new UsuarioAdminRespuesta();
            }
        }
        public async Task<LoginRespuesta> Login(LoginEnviar envio)
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
