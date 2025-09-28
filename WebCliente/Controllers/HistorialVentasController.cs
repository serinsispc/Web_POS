using Newtonsoft.Json;
using RunApi.API_DIAN;
using RunApi.ApiControlers;
using RunApi.Funciones;
using RunApi.Funciones.DIAN_API;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Web;
using System.Web.Helpers;
using System.Web.Mvc;
using System.Xml.Linq;
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
            model.Fecha1=DateTime.Now;
            model.Fecha2=DateTime.Now;
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
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ListaResoluciones(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            var listaresoluciones =await V_ResolucionesControler.Lista();

            Session["idventa"] = idventa;
            Session["V_Resoluciones"] = JsonConvert.SerializeObject(listaresoluciones);
            string json = Session["V_Resoluciones"].ToString();
            ModelView(model);
            return View("Index");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SeleccionarResoluciones(int idResolucion)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            //en esta parte modificamos el id de la resolución de la table ventas
            int idventa = Convert.ToInt32(Session["idventa"]);
            var respuesta = await HistorialVentasAPI.EditarIdResolucion(idventa,idResolucion);

            if (respuesta.estado)
            {
                string db = Session["db"].ToString();
                model.V_TablaVentas =await V_TablaVentasControler.Filtrar(db,model.Fecha1,model.Fecha2);
            }

            Session["V_Resoluciones"] = "[]";
            
            ModelView(model);
            return View("Index");
        }
        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> BotonEditar_AgregarCliente(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            var listaClientes = await HistorialVentasAPI.ListaClientes();

            Session["idventa"] = idventa;
            Session["V_Clientes"] = JsonConvert.SerializeObject(listaClientes);

            ModelView(model);
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> SeleccionarCliente(int idCliente)
        {
            // Restaura el modelo de sesión y vuelve al Index
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            // Recupera el idventa por si necesitas asociar el cliente a la venta
            var idventa = 0;
            if (Session["idventa"] != null)
                int.TryParse(Session["idventa"].ToString(), out idventa);

            // TODO: tu lógica para asociar el cliente seleccionado a la venta / modelo
            // Por ejemplo:
            var respuesta= await HistorialVentasAPI.AsociarClienteAVenta(idventa, idCliente);
            if (respuesta.estado)
            {
                model.V_TablaVentas =await V_TablaVentasControler.Filtrar(Session["db"].ToString(),model.Fecha1,model.Fecha2);
            }
            // Limpia la lista para que el modal no reaparezca al recargar
            Session.Remove("V_Clientes");


            ModelView(model);
            // Puedes mostrar un toast/alert de éxito en la vista si ya lo manejas
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> BuscarNIT_DIAN(int nit)
        {
            // Restaura el modelo de sesión y vuelve al Index
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            //declaramos la variable del token
            string token= string.Empty;
            //consultamos el token
            token =await HistorialVentasAPI.ConsultarToken();
            //en esta parte hacemos la consulta a la DIAN
            var reques = new ConsultarNIT_Request();
            reques.Environment.TypeEnvironmentId = 1;
            reques.TypeDocumentIdentificationId = 6;
            reques.IdentificationNumber = nit;
            var respuesta = await API_DIAN.ConsultarNIT(reques,token);

            if (respuesta.Message == null)
            {
                AcquirerDto acquirerDto = new AcquirerDto();
                acquirerDto.Message = respuesta.Message;
                acquirerDto.Email = respuesta.Email;
                acquirerDto.Name = respuesta.Name;
                acquirerDto.Nit = nit.ToString();
                var b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(acquirerDto)));
                TempData["AcquirerB64"] = b64;
                ViewBag.DebeMostrarModalClientes = true;
            }
            else
            {
                TempData["AcquirerMsg"] = respuesta.Message;
                ViewBag.DebeMostrarModalClientes = true;
            }

            ModelView(model);
            return View("Index");
        }

    }
}