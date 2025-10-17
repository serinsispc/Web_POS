using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebCliente.Controllers
{
    public class HomeController : Controller
    {
        public ActionResult Index()
        {
            return View();
        }

        public ActionResult About()
        {
            ViewBag.Message = "Your application description page.";

            return View();
        }

        public ActionResult Contact()
        {
            ViewBag.Message = "Your contact page.";

            return View();
        }
        [HttpGet]
        public ActionResult Inversion()
        {
            return View("Inversion"); // devuelve la vista anterior
        }

        [HttpPost]
        public ActionResult Postular(string Nombre, string Email, string Telefono, decimal? Monto, string Mensaje)
        {
            // TODO: guarda en DB o envía correo
            TempData["ok"] = "¡Gracias! Tu postulación fue enviada. Te contactaremos pronto.";
            return RedirectToAction("Inversion");
        }

        [HttpGet]
        public ActionResult DescargarContrato()
        {
            return View();
        }

    }
}