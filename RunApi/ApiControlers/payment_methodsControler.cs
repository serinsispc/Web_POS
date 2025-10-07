using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.ApiControlers
{
    public class payment_methodsControler
    {
        public static async Task<List<payment_methods>> Lista()
        {
            try
            {

            }
            catch(Exception ex)
            {
                string message = ex.Message;
                return null;
            }
        }
    }
}
