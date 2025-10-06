using RunApi.Envio;
using RunApi.Respuesta;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Runtime.InteropServices;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace RunApi
{
    public class ClassAPI
    {
        public static string ErrorProsesoDian { get; private set; }
        private readonly HttpClient _httpClient;
        //public string UrlEndPoint { get; set; } = "https://www.serinsispc.com/ApiSerinsisPC/api/";
        public string UrlEndPoint { get; set; } = "https://localhost:7004/api/";
        //public string UrlEndPoint { get; set; } = "http://localhost/Api/api/";
        public string UrlEndPintDIAN { get; set; } = "https://erog.apifacturacionelectronica.xyz";
        public string token_ { get; set; } = "4007005B-3F7A-4D5B-A6E3-0711DF09FA55";

        public ClassAPI()
        {
            _httpClient = new HttpClient();
        }

        //public async Task<string> HttpWebRequestPostAsync(string url, string json, HttpMethod httpMethod, [Optional] bool dian, [Optional]string tokenDIAN)
        //{
        //    try
        //    {
        //        string token_=string.Empty;
        //        var request = new HttpRequestMessage();
        //        if (dian)
        //        {
        //            request = new HttpRequestMessage(httpMethod, UrlEndPintDIAN + url);
        //            token_ = tokenDIAN;
        //        }
        //        else
        //        {
        //            request = new HttpRequestMessage(httpMethod, UrlEndPoint + url);
        //            token_ = token;
        //        }
               

        //        request.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));

        //        if (!string.IsNullOrEmpty(token_))
        //        {
        //            request.Headers.Authorization = new AuthenticationHeaderValue("Bearer", token_);
        //        }

        //        if ((httpMethod == HttpMethod.Post || httpMethod == HttpMethod.Put) && json != null)
        //        {
        //            request.Content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");
        //        }

        //        HttpResponseMessage response = await _httpClient.SendAsync(request);

        //        string result = await response.Content.ReadAsStringAsync();

        //        return response.IsSuccessStatusCode ? result : $"Error {(int)response.StatusCode}: {result}";
        //    }
        //    catch (Exception ex)
        //    {
        //        return $"Excepción: {ex.Message}";
        //    }
        //}

        public Task<string> HttpWebRequestPostAsync(string Url, string Json, HttpMethod httpMethod, [Optional] bool dian, [Optional] string token)
        {
            string UrlEndPoint_ = UrlEndPoint;
           
            if (dian) 
            { 
                UrlEndPoint_ = UrlEndPintDIAN; 
            }
            else
            {
                token = token_;
            }

            


            System.Net.ServicePointManager.SecurityProtocol = SecurityProtocolType.Tls12;

            Task<string> task = Task.Run(() =>
            {
                string Response = null;

                try
                {
                    /// ServicePointManager.ServerCertificateValidationCallback = new RemoteCertificateValidationCallback(delegate { return true; });
                    HttpWebRequest httpWebRequest = (HttpWebRequest)WebRequest.Create(UrlEndPoint_ + Url);

                    httpWebRequest.ContentType = "application/json";
                    httpWebRequest.Accept = "application/json";
                    httpWebRequest.Method = httpMethod.ToString();

                    if (!string.IsNullOrEmpty(token))
                    {
                        httpWebRequest.Headers.Add("Authorization", "Bearer " + token);

                    }

                    if ((httpMethod == HttpMethod.Post || httpMethod == HttpMethod.Put) && Json != null)
                    {
                        try
                        {
                            using (StreamWriter streamWriter = new StreamWriter(httpWebRequest.GetRequestStream()))
                            {

                                streamWriter.Write(Json);
                                streamWriter.Flush();
                                streamWriter.Close();
                            }
                        }
                        catch (Exception ex)
                        {
                            string error = ex.Message;
                            Response = error;
                        }

                    }
                    using (HttpWebResponse httpResponse = (HttpWebResponse)httpWebRequest.GetResponse())
                    {
                        using (StreamReader streamReader = new StreamReader(httpResponse.GetResponseStream()))
                        {
                            if (httpResponse.StatusCode == HttpStatusCode.OK || httpResponse.StatusCode == HttpStatusCode.Created)
                            {
                                Response = streamReader.ReadToEnd();
                            }
                        }
                    }
                }
                catch (WebException ex)
                {
                    Response = new StreamReader(ex.Response.GetResponseStream()).ReadToEnd();
                    ErrorProsesoDian = Response;
                }
                catch (Exception ex)
                {
                    string error = ex.Message;
                    Response = "error";
                }

                return Response;
            });
            return task;
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
