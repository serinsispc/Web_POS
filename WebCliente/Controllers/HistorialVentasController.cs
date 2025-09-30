using Microsoft.Ajax.Utilities;
using Newtonsoft.Json;
using RunApi.API_DIAN;
using RunApi.ApiControlers;
using RunApi.Funciones;
using RunApi.Funciones.DIAN_API;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
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
            var model = new HistorialVentasViewModels();
            model.Fecha1 = DateTime.Now;
            model.Fecha2 = DateTime.Now;
            model.V_TablaVentas = await V_TablaVentasControler.Filtrar(Session["db"].ToString(), DateTime.Now, DateTime.Now);
            ModelView(model);
            return View();
        }

        public void ModelView(HistorialVentasViewModels model)
        {
            string json = JsonConvert.SerializeObject(model);
            Session["HistorialVentasJson"] = json;
        }

        [HttpGet]
        [ActionName("Filtrar")]
        public ActionResult Filtrar_Alias_Get()
        {
            return RedirectToAction("Index");
        }

        // 🔹 Tolerante a nulls
        public async Task<ActionResult> Filtar(DateTime? fecha1 = null, DateTime? fecha2 = null, string nombreCliente = null)
        {
            var f1 = fecha1 ?? DateTime.Today;
            var f2 = fecha2 ?? DateTime.Today;

            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());
            model.Fecha1 = f1;
            model.Fecha2 = f2;

            var respTabla = await V_TablaVentasControler.Filtrar(Session["db"].ToString(), f1, f2);

            if (!string.IsNullOrWhiteSpace(nombreCliente))
            {
                model.NombreCliente = nombreCliente;
                model.V_TablaVentas = respTabla.Where(x => x.nombreCliente.Contains(nombreCliente)).ToList();
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
        public async Task<ActionResult> FiltarNumeroFactura(int? numerofactura = null)
        {
            if (!numerofactura.HasValue)
            {
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
        public async Task<ActionResult> FiltarNombreCliente(string nombreCliente = null)
        {
            var criterio = (nombreCliente ?? "").Trim();

            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());
            var respTabla = await V_TablaVentasControler.FiltrarNombreCliente(Session["db"].ToString(), criterio);

            model.V_TablaVentas = respTabla;
            model.NumeroFactura = null;
            model.NombreCliente = criterio;

            ModelView(model);
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ListaResoluciones(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            var listaresoluciones = await V_ResolucionesControler.Lista();

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

            int idventa = Convert.ToInt32(Session["idventa"]);
            var respuesta = await HistorialVentasAPI.EditarIdResolucion(idventa, idResolucion);

            if (respuesta.estado)
            {
                string db = Session["db"].ToString();
                model.V_TablaVentas = await V_TablaVentasControler.Filtrar(db, model.Fecha1, model.Fecha2);
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
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            var idventa = 0;
            if (Session["idventa"] != null)
                int.TryParse(Session["idventa"].ToString(), out idventa);

            var respuesta = await HistorialVentasAPI.AsociarClienteAVenta(idventa, idCliente);
            if (respuesta.estado)
            {
                model.V_TablaVentas = await V_TablaVentasControler.Filtrar(Session["db"].ToString(), model.Fecha1, model.Fecha2);
            }

            Session.Remove("V_Clientes");

            ModelView(model);
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> BuscarNIT_DIAN(int nit)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            string token = await HistorialVentasAPI.ConsultarToken();
            var reques = new ConsultarNIT_Request();
            reques.Environment.TypeEnvironmentId = 1;
            reques.TypeDocumentIdentificationId = 6;
            reques.IdentificationNumber = nit;
            var respuesta = await API_DIAN.ConsultarNIT(reques, token);

            if (respuesta.Message == null)
            {
                AcquirerDto acquirerDto = new AcquirerDto();
                acquirerDto.Message = respuesta.Message;
                acquirerDto.Email = respuesta.Email;
                acquirerDto.Name = respuesta.Name;
                acquirerDto.Nit = nit.ToString();
                acquirerDto.NombreComercial = respuesta.Name;
                acquirerDto.Telefono = "0";
                acquirerDto.Direccion = "-";
                var b64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(JsonConvert.SerializeObject(acquirerDto)));
                string acquirer = JsonConvert.SerializeObject(acquirerDto);
                Session["acquirer"] = acquirer;
                TempData["AcquirerB64"] = b64;
                ViewBag.DebeMostrarModalClientes = true;
            }
            else
            {
                AcquirerDto acquirerDto = new AcquirerDto();
                acquirerDto.Message = respuesta.Message;
                acquirerDto.Email = "";
                acquirerDto.Name = "";
                acquirerDto.Nit = nit.ToString();
                acquirerDto.NombreComercial = "";
                acquirerDto.Telefono = "0";
                acquirerDto.Direccion = "-";
                string acquirer = JsonConvert.SerializeObject(acquirerDto);
                Session["acquirer"] = acquirer;
                TempData["AcquirerMsg"] = $"No se encontro el NIT:{nit}";
                ViewBag.DebeMostrarModalClientes = true;
            }

            ModelView(model);
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> EnviarFacturaDIAN(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            if (idventa > 0)
            {
                var respuesta = await API_DIAN.FacturaElectronica(idventa);
            }
            var respTabla = await V_TablaVentasControler.Filtrar(Session["db"].ToString(), model.Fecha1, model.Fecha2);
            model.V_TablaVentas = respTabla;
            ModelView(model);
            return View("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> ExportarExcelFiltro()
        {
            var jsonSession = Session["HistorialVentasJson"] as string;
            if (string.IsNullOrWhiteSpace(jsonSession))
                return RedirectToAction("Index");

            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(jsonSession);
            if (model == null)
                return RedirectToAction("Index");

            var ventas = await ExportarExcelAPI.ExportarExcels(model.Fecha1, model.Fecha2);
            string ventasJson = JsonConvert.SerializeObject(ventas);

            var result = await ExportarExcelAPI.VentasExcel(ventasJson);
            if (result == null || result.Bytes == null || result.Bytes.Length == 0)
                return new HttpStatusCodeResult(500, "No fue posible generar el Excel.");

            var contentType = string.IsNullOrWhiteSpace(result.ContentType)
                ? "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                : result.ContentType;

            var fileName = string.IsNullOrWhiteSpace(result.FileName)
                ? $"ventas_{DateTime.Now:yyyyMMdd_HHmmss}.xlsx"
                : result.FileName;

            return File(result.Bytes, contentType, fileName);
        }

    }
}
