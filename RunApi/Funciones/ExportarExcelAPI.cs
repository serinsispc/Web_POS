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
    public class ExportarExcelAPI
    {
        public static async Task<List<ExportarExcel>> ExportarExcels(DateTime fecha1,DateTime fecha2)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, fecha1=fecha1, fecha2=fecha2};
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"V_TablaVentas/ExportarExcelFiltro";
                var resp=await api.HttpWebRequestPostAsync(url,json,HttpMethod.Post);
                return JsonConvert.DeserializeObject<List<ExportarExcel>>(resp);
            }
            catch(Exception ex)
            {
                string error = ex.Message;
                return null;
            }
        }
        public sealed class FileResultDto
        {
            public byte[] Bytes { get; set; } = Array.Empty<byte>();
            public string ContentType { get; set; } =
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
            public string FileName { get; set; } =
                $"ventas_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx";
        }

        public static async Task<FileResultDto> VentasExcel(string json)
        {
            try
            {
                var api=new ClassAPI();
                string url = api.UrlEndPoint;
                using (var http = new HttpClient { BaseAddress = new Uri(url) })
                using (var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json"))
                using (var resp = await http.PostAsync("export/ventas-excel", content))
                {
                    if (!resp.IsSuccessStatusCode)
                    {
                        var error = await resp.Content.ReadAsStringAsync();
                        throw new Exception($"Error {(int)resp.StatusCode}: {error}");
                    }

                    var bytes = await resp.Content.ReadAsByteArrayAsync();
                    var cd = resp.Content.Headers.ContentDisposition;

                    return new FileResultDto
                    {
                        Bytes = bytes,
                        ContentType = resp.Content.Headers.ContentType != null
                                      ? resp.Content.Headers.ContentType.MediaType
                                      : "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        FileName = ((cd != null ? (cd.FileNameStar ?? cd.FileName) : null)
                                    ?? $"ventas_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx").Trim('"')
                    };
                }
            }
            catch
            {
                return null; // maneja/loguea el error si lo necesitas
            }
        }


    }
}
