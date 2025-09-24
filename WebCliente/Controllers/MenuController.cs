using RunApi.ApiControlers;
using RunApi.Models;
using RunApi.Models.Cliente;
using RunApi.Respuesta;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;

namespace WebCliente.Controllers
{
    public class MenuController : Controller
    {
        [HttpGet]
        public async Task<ActionResult> Index()
        {
            if (Session["usuario"] != null)
            {
                ViewBag.login = Session["usuario"];
                var login = Newtonsoft.Json.JsonConvert.DeserializeObject<LoginRespuesta>(Session["usuario"].ToString());
                ClassDBCliente.DBCliente = login.dbCliente;
                /*en esta parte consultamos la informacion de la empresa que se encuentra en la tabla sede*/
                ConfiguracionDian configuracion = new ConfiguracionDian();
                configuracion = await ConfiguracionDianControler.ConsultarCD();
                if (configuracion != null) 
                {
                    Session["razonSocial"] = configuracion.razonSocial;
                }
                string userxx = Session["usuario"].ToString();
                Session["nombreUsuario"] = login.v_Usuario.nombreUsuario;
                Session["tipoUsuario"] = login.v_Usuario.nombreTipoUsuario;
                return View(); // También puedes usar ViewBag si no quieres pasar el modelo
            }
            return RedirectToAction("Error", "Home"); // O una vista alternativa si no hay datos
        }
        [HttpGet]
        public async Task<ActionResult> CerrarSesion()
        {
            // Abandonar y limpiar la sesión
            Session.Clear();
            Session.Abandon();

            // Opcional: borrar cookies de autenticación si estás usando FormsAuthentication
            if (Request.Cookies[".ASPXAUTH"] != null)
            {
                var cookie = new HttpCookie(".ASPXAUTH");
                cookie.Expires = DateTime.Now.AddDays(-1);
                Response.Cookies.Add(cookie);
            }

            // Redirigir al Login
            return RedirectToAction("Index", "Login");
        }
    }
}