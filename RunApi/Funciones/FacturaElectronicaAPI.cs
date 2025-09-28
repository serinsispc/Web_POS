using Newtonsoft.Json;
using RunApi.Models;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http;
using System.Runtime.Remoting;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.Funciones
{
    public class FacturaElectronicaAPI
    {
        public static async Task<int> ConcecutivoFE(int idResolcuoin)
        {
            try
            {
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idresolucion=idResolcuoin };
                string json=JsonConvert.SerializeObject(objeto);
                var api = new ClassAPI();
                var url = $"FacturaElectronica/ConsultarConsecutivo";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Get);
                return JsonConvert.DeserializeObject<int>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return 0;
            }
        }
    }
}
