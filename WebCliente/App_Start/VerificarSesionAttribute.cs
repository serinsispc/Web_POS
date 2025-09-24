using System;
using System.Web;
using System.Web.Mvc;

namespace WebCliente.App_Start
{
    public class VerificarSesionAttribute : ActionFilterAttribute
    {
        public override void OnActionExecuting(ActionExecutingContext filterContext)
        {
            string controller = filterContext.ActionDescriptor.ControllerDescriptor.ControllerName;
            string action = filterContext.ActionDescriptor.ActionName;

            // Lista blanca: controladores y acciones que no requieren sesión
            bool accesoLibre =
                (controller.Equals("Home", StringComparison.OrdinalIgnoreCase) && action.Equals("Index", StringComparison.OrdinalIgnoreCase)) ||
                (controller.Equals("Home", StringComparison.OrdinalIgnoreCase) && action.Equals("ElegirSistema", StringComparison.OrdinalIgnoreCase)) ||
                (controller.Equals("Login", StringComparison.OrdinalIgnoreCase)) ||
                (controller.Equals("LoginParqueadero", StringComparison.OrdinalIgnoreCase));

            if (!accesoLibre)
            {
                // Validar que exista alguna sesión activa (puedes validar ambas si manejas 2 tipos)
                bool sesionPOS = HttpContext.Current.Session["usuario"] != null;
                bool sesionParqueadero = HttpContext.Current.Session["UsuarioParqueadero"] != null;

                if (!sesionPOS && !sesionParqueadero)
                {
                    // Redirige a la página inicial de selección de sistema
                    filterContext.Result = new RedirectResult("~/Home/Index");
                }
            }

            base.OnActionExecuting(filterContext);
        }
    }
}
