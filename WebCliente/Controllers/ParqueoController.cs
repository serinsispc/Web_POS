using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebCliente.Controllers
{
    public class ParqueoController : Controller
    {
        // GET: Parqueo
        public ActionResult Index()
        {
            return View();
        }
        [HttpPost]
        public ActionResult AccionPlaca(string placa)
        {
            if (!string.IsNullOrWhiteSpace(placa))
            {
                placa = placa.ToUpper();
                // Aquí podrías hacer más validaciones o lógica
            }
            else
            {
                //ViewBag.MensajeAlerta = "Por favor ingresa una placa antes de continuar.";
            }

            return View("Index");
        }
        [HttpPost]
        public ActionResult CerrarSesion()
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
            return RedirectToAction("Index", "LoginParqueadero"); // Redirige al login
        }

    }
}