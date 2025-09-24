using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using WebCliente.ViewModels;

namespace WebCliente.Controllers
{
    public class HistorialVentasController : Controller
    {
        // GET: HistorialVentas
        public ActionResult Index()
        {
            //en esta parte enviamos el model en la session HistorialVentasJson
            var model = new HistorialVentasViewModels 
            { 
                V_TablaVentas =
                };
            return View();
        }
    }
}