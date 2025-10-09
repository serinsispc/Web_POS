using Microsoft.Ajax.Utilities;
using Newtonsoft.Json;
using RunApi.API_DIAN;
using RunApi.API_DIAN.Respons;
using RunApi.ApiControlers;
using RunApi.Funciones;
using RunApi.Funciones.DIAN_API;
using RunApi.Models;
using RunApi.Models.Cliente;
using RunApi.Request;
using System;
using System.Collections.Generic;
using System.Configuration;
using System.Linq;
using System.Net.Http;
using System.Reflection;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
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
            if (Session[""] != null)
            {
                model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());
            }
            else
            {
                model.Fecha1 = DateTime.Now;
                model.Fecha2 = DateTime.Now;
                model.V_TablaVentas = await V_TablaVentasControler.Filtrar(Session["db"].ToString(), DateTime.Now, DateTime.Now);
            }
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

            // 🔑 Evita que el modal de Clientes se auto-abra en este request
            Session.Remove("V_Clientes");

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
        public ActionResult CancelarResoluciones()
        {
            // 🔧 apaga el trigger si el usuario cierra el modal sin elegir
            Session.Remove("V_Resoluciones");
            return new HttpStatusCodeResult(204);
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> BotonEditar_AgregarCliente(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());

            // 🔧 evita que Resoluciones se auto-abra después
            Session.Remove("V_Resoluciones");

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
                var resp_proceso = JsonConvert.DeserializeObject<FacturaElectronica_Respons>(respuesta);
                var erroresLimpios =
                  (resp_proceso?.errors_messages ?? Enumerable.Empty<string>())
                  .Where(s => !string.IsNullOrWhiteSpace(s))
                  .Select(s => s.Trim())
                  .Distinct(StringComparer.OrdinalIgnoreCase)
                  .ToList();

                string mensajeError = erroresLimpios.Count == 0
                    ? "Se produjo un error no especificado."
                    : "Se encontraron los siguientes errores:" + Environment.NewLine +
                      "• " + string.Join(Environment.NewLine + "• ", erroresLimpios);
                if (resp_proceso.is_valid)
                {
                    model.AlertModerno = AlertModerno.CargarAlert(true, resp_proceso.status_message, mensajeError, "success");
                }
                else
                {


                    model.AlertModerno = AlertModerno.CargarAlert(true, resp_proceso.status_message, mensajeError, "error");
                }
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

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Anularfactura(int idventa)
        {
            var model = JsonConvert.DeserializeObject<HistorialVentasViewModels>(Session["HistorialVentasJson"].ToString());
            var respuestaAPI = await API_DIAN.NotaCreditoElectronica(idventa);
            if (respuestaAPI.estado)
            {
                var responsCRUD = JsonConvert.DeserializeObject<NotaCreditoResponse>(respuestaAPI.data);
                var erroresLimpios =
                  (responsCRUD?.errors_messages ?? Enumerable.Empty<string>())
                  .Where(s => !string.IsNullOrWhiteSpace(s))
                  .Select(s => s.Trim())
                  .Distinct(StringComparer.OrdinalIgnoreCase)
                  .ToList();

                string mensajeError = erroresLimpios.Count == 0
                    ? "Se produjo un error no especificado."
                    : "Se encontraron los siguientes errores:" + Environment.NewLine +
                      "• " + string.Join(Environment.NewLine + "• ", erroresLimpios);
                model.AlertModerno = AlertModerno.CargarAlert(true, responsCRUD.status_message, mensajeError, "success");
                model.V_TablaVentas = await V_TablaVentasControler.Filtrar(ClassDBCliente.DBCliente, model.Fecha1, model.Fecha2);
            }
            else
            {
                model.AlertModerno = AlertModerno.CargarAlert(true, "Error", respuestaAPI.mensaje, "success");
            }
            ModelView(model);
            return View("Index");

        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> MediosDePago(int idventa)
        {
            if (idventa <= 0)
            {
                if (Request.IsAjaxRequest())
                    return Json(new { estado = 0, mensaje = "Id de venta inválido." }, JsonRequestBehavior.AllowGet);
                TempData["Alert"] = "Id de venta inválido.";
                return RedirectToAction("Index");
            }

            var pagos = await V_VentasPagosInternosControler.ConsultarIdVenta(idventa);
            var internos = await V_R_MediosDePago_MediosDePagoInternosControler.Lista();
            var methods = await payment_methodsControler.Lista_payment();

            // <-- Si algún día llamas por AJAX, devuelve los datos reales (ahora mismo devolvías arrays vacíos)
            if (Request.IsAjaxRequest())
                return Json(new { estado = 1, data = new { pagos, internos, paymentMethods = methods } }, JsonRequestBehavior.AllowGet);

            // --- Flujo POST-back: guarda datos en Session y haz que la vista abra el modal ---
            var payload = new { pagos, internos, paymentMethods = methods };
            Session["MediosDePago_json"] = Newtonsoft.Json.JsonConvert.SerializeObject(payload);
            Session["idventaMedioPago"] = idventa;
            TempData["AutoOpenMediosPago"] = true;

            return RedirectToAction("Index");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<JsonResult> GuardarMedio(int id, int idMedioPagoDian, int idMedioPagoInterno, decimal valor)
        {
            try
            {
                // Validación de sesión requerida por tu flujo
                if (Session["idventaMedioPago"] == null || !int.TryParse(Session["idventaMedioPago"].ToString(), out var idVentaSesion))
                {
                    Response.StatusCode = 400;
                    return Json(new { estado = 0, idAfectado = 0, mensaje = "No se encontró idventa en sesión." }, JsonRequestBehavior.AllowGet);
                }

                // Determinar INSERT / UPDATE
                int funcion = 0;
                var pagosVenta = await PagosVentaControler.ConsultarID(id);
                if (pagosVenta != null)
                {
                    funcion = 1; // UPDATE
                }
                else
                {
                    pagosVenta = new PagosVenta { id = 0 }; // INSERT
                }

                // Mapear campos
                pagosVenta.idVenta = idVentaSesion;
                pagosVenta.payment_methods_id = idMedioPagoDian;
                pagosVenta.idMedioDePagointerno = idMedioPagoInterno;
                pagosVenta.valorPago = valor;

                // Ejecutar CRUD
                var respCRUD = await PagosVentaControler.CRUD(pagosVenta, funcion);

                // Status HTTP coherente
                Response.StatusCode = (respCRUD?.estado == true) ? 200 : 400;

                // Evita doble serialización: devuelve el objeto directamente
                return Json(respCRUD, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                Response.StatusCode = 500;
                return Json(new { estado = 0, idAfectado = 0, mensaje = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }


        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<ActionResult> Retour(int idventa, CancellationToken ct)
        {
            if (idventa <= 0)
                return new HttpStatusCodeResult(400, "Id de venta inválido.");

            try
            {
                // TODO: trae tu base64 real desde BD/servicio
                /* en esta parte consultamos el pdfbase64 de la factura con respecto al id de la venta */
                var fejson=await FacturaElectronicaJSONAPI.ConsultarIdVenta(idventa);
                var pdfBase64 = "";
                if (fejson != null)
                {
                    pdfBase64 = fejson.pdf_base64_bytes;
                }
                else
                {
                    return new HttpStatusCodeResult(500, "Error obteniendo PDF: ");
                }

                if (string.IsNullOrWhiteSpace(pdfBase64))
                    return new HttpStatusCodeResult(404, "No se encontró PDF para esta venta.");

                // Limpia prefijo data-uri si existiera y espacios
                pdfBase64 = System.Text.RegularExpressions.Regex
                    .Replace(pdfBase64, @"^data:.*;base64,", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase)
                    .Trim();

                // Devuelve JSON sin escapar las barras "/"
                var payload = new { ok = true, fileName = $"Factura_{idventa}.pdf", base64 = pdfBase64 };
                var json = JsonConvert.SerializeObject(payload, new JsonSerializerSettings
                {
                    StringEscapeHandling = StringEscapeHandling.Default // evita "\/"
                });

                return Content(json, "application/json"); // en vez de JsonResult estándar
            }
            catch (OperationCanceledException)
            {
                return new HttpStatusCodeResult(499, "Solicitud cancelada.");
            }
            catch (Exception ex)
            {
                return new HttpStatusCodeResult(500, "Error obteniendo PDF: " + ex.Message);
            }
        }

        // En tu HistorialVentasController (o donde corresponda)
        [HttpGet]
        [OutputCache(NoStore = true, Duration = 0, VaryByParam = "*")]
        public ActionResult VerDetalle(int idventa)
        {
            try
            {
                // TODO: reemplaza por tu acceso real a datos
                // Ej: var items = V_DetalleCajaRepo.ConsultarPorVenta(idventa);
                var items = new List<V_DetalleCaja>(); // demo

                var planos = items.Select(x => new
                {
                    id = x.id,
                    idVenta = x.idVenta,
                    codigoProducto = x.codigoProducto ?? "",
                    nombreProducto = x.nombreProducto ?? "",
                    presentacion = x.presentacion ?? "",
                    unidad = x.unidad ?? 0m,
                    preVentaNeto = x.preVentaNeto ?? 0m,
                    precioVenta = x.precioVenta ?? 0m,
                    descuentoDetalle = x.descuentoDetalle ?? 0m,
                    porImpuesto = x.porImpuesto ?? 0m,
                    baseImpuesto = x.baseImpuesto ?? 0m,
                    valorImpuesto = x.valorImpuesto ?? 0m,
                    subTotalDetalleNeto = x.subTotalDetalleNeto ?? 0m,
                    subTotalDetalle = x.subTotalDetalle ?? 0m,
                    totalDetalle = x.totalDetalle ?? 0m,
                    costoUnidad = x.costoUnidad ?? 0m,
                    contenido = x.contenido ?? 0m,
                    costoTotal = x.costoTotal ?? 0m,
                    observacion = x.observacion ?? "",
                    opciones = x.opciones ?? "",
                    adiciones = x.adiciones ?? "",
                    // cálculo auxiliar si subTotalDetalle vino nulo/0
                    subtotal_calc = (x.unidad ?? 0m) * (x.precioVenta ?? 0m) - (x.descuentoDetalle ?? 0m)
                }).ToList();

                return Json(new { ok = true, items = planos }, JsonRequestBehavior.AllowGet);
            }
            catch (Exception ex)
            {
                return Json(new { ok = false, message = ex.Message }, JsonRequestBehavior.AllowGet);
            }
        }

    }
}
