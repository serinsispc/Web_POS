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
            model.V_TablaVentas =await V_TablaVentasControler.Filtrar(Session["db"].ToString(),DateTime.Now, DateTime.Now);
            ModelView(model);
            return View();
        
        }
        /// <summary>
        /// función que se encarga de transformar el model y cargarlo a la session
        /// </summary>
        /// <param name="model"></param>
        /// <returns></returns>
        public void ModelView(HistorialVentasViewModels model)
        {
            string json = JsonConvert.SerializeObject(model);
            Session["HistorialVentasJson"] = json;
        }
        public async Task<ActionResult> Filtar(DateTime fecha1, DateTime fecha2,string nombreCliente)
        {
            // Normaliza rango (incluye todo el día de fecha2 si lo necesitas)
            var desde = fecha1.Date;
            var hasta = fecha2.Date.AddDays(1).AddTicks(-1);

            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());
            model.Fecha1 = fecha1;
            model.Fecha2 = fecha2;
       
            var respTabla= await V_TablaVentasControler.Filtrar(Session["db"].ToString(), fecha1, fecha2);
            if (nombreCliente != null)
            {
                model.NombreCliente = nombreCliente;
                model.V_TablaVentas = respTabla.Where(x=>x.nombreCliente.Contains(nombreCliente)).ToList();
            }
            else
            {
                model.V_TablaVentas = respTabla;
            }

            ModelView(model);
            return View("Index");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> FiltarNumeroFactura(int? numerofactura)
        {
            if (!numerofactura.HasValue)
            {
                // si llega vacío, puedes redirigir o recargar la vista con un mensaje
                TempData["Msg"] = "Ingrese un número de factura válido.";
                return RedirectToAction("Index");
            }

            var raw = Session["HistorialVentasJson"] as string ?? "{}";
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(raw);

            var respTabla = await V_TablaVentasControler.FiltrarNumeroFactura(Session["db"].ToString(), numerofactura.Value);

            model.V_TablaVentas = respTabla;
            model.NumeroFactura = numerofactura.Value.ToString();
            model.NombreCliente = null;

            ModelView(model);
            return View("Index");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> FiltarNombreCliente(string nombreCliente)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            var respTabla = await V_TablaVentasControler.FiltrarNombreCliente(Session["db"].ToString(), nombreCliente);
            model.V_TablaVentas = respTabla;
            model.NumeroFactura = null;
            model.NombreCliente = $"{nombreCliente}";

            ModelView(model);
            return View("Index");
        }
    }
}