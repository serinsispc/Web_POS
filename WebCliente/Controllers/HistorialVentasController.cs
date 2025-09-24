using Newtonsoft.Json;
using RunApi.ApiControlers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebCliente.ViewModels;

namespace WebCliente.Controllers
{
    public class HistorialVentasController : Controller
    {
        // GET: HistorialVentas
        public async Task<ActionResult> Index()
        {
            //en esta parte enviamos el model en la session HistorialVentasJson
            var model = new HistorialVentasViewModels();
            model.V_TablaVentas =await V_TablaVentasControler.FiltrarDIA();
            Session["HistorialVentasJson"] = JsonConvert.SerializeObject(model);
            return View();
        
        }
    }
}