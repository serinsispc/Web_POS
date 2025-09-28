using Newtonsoft.Json;
using RunApi.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Linq.Expressions;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class TablaVentaAPI
    {
        public static async Task<bool> AgregarObservacion(int idventa,string observacion)
        {
            try
            {
                var objeto = new {
                    nombreDB=ClassDBCliente.DBCliente,
                    observacion=observacion,
                    idventa=idventa
                };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"TablaVenta/AgregarObservicio";
                var resp=await api.HttpWebRequestPostAsync(url, json,HttpMethod.Put);
                return JsonConvert.DeserializeObject<bool>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return false;
            }
        }
    }
}
