using System.Web;
using System.Web.Mvc;
using WebCliente.App_Start;

namespace WebCliente
{
    public class FilterConfig
    {
        public static void RegisterGlobalFilters(GlobalFilterCollection filters)
        {
            filters.Add(new HandleErrorAttribute());
            // Añadir el filtro de sesión
            filters.Add(new VerificarSesionAttribute());
        }
    }
}
