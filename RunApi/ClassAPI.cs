using RunApi.Envio;
using RunApi.Models;
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


        public Task<string> HttpWebRequestPostAsync(string Url, string Json, HttpMethod httpMethod, [Optional] string NombreDB, [Optional] bool dian, [Optional] string token)
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

                    if (!string.IsNullOrEmpty(NombreDB))
                    {
                        httpWebRequest.Headers.Add("X-NombreDB", NombreDB);
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


    }
}
