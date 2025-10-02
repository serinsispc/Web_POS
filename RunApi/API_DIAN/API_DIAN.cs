using Newtonsoft.Json;
using RunApi.API_DIAN;
using RunApi.API_DIAN.Objetos;
using RunApi.API_DIAN.Request;
using RunApi.API_DIAN.Respons;
using RunApi.ApiControlers;
using RunApi.Envio;
using RunApi.Models;
using RunApi.Models.Cliente;
using RunApi.Request;
using RunApi.Utilidades;
using System;
using System.Collections.Generic;
using System.Data.SqlTypes;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;
using static RunApi.API_DIAN.Request.NotaCreditoRequest;
using static System.Runtime.CompilerServices.RuntimeHelpers;

namespace RunApi.Funciones.DIAN_API
{
    public class API_DIAN
    {
        public static async Task<ConsultarNIT_Respons> ConsultarNIT(ConsultarNIT_Request request, string token)
        {
            try
            {
                var api =new ClassAPI();
                string json=JsonConvert.SerializeObject(request);
                var url = $"/api/ubl2.1/status/acquirer";
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post, true, token.Replace("\"",""));
                return JsonConvert.DeserializeObject<ConsultarNIT_Respons>(resp);
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return new ConsultarNIT_Respons() { Message = msg };
            }
        }
        public static async Task<string> FacturaElectronica(int IdVenta_frm, [Optional] bool numeroFE)
        {
            int IdCliente_frm = 0;
            GetDataFactura_JSON getDataFactura_JSON = new GetDataFactura_JSON();
            getDataFactura_JSON =await GetDataFactura_JSON_API.DataFactura(IdVenta_frm);

            if (getDataFactura_JSON == null)
            {
                return "error";
            }



            V_TablaVentas venta = new V_TablaVentas();
            venta = getDataFactura_JSON.V_TablaVentas;
            if (venta == null)
            {
                return "error";
            }
            ClassAPI classAPI = new ClassAPI();
            FacturaElectronica_Request facturaNacional = new FacturaElectronica_Request();
            int numeroFacturaElectronica = 0;
            numeroFacturaElectronica = await FacturaElectronicaAPI.ConcecutivoFE((int)venta.idResolucion);



            facturaNacional.number= numeroFacturaElectronica;
         
            facturaNacional.resolution_id = Convert.ToInt32(venta.idResolucion);
            facturaNacional.type_document_id = 1;
            if ($"{venta.fechaVenta:yyyy-MM-dd}" == $"{DateTime.Today:yyy-MM-dd}")
            {
                facturaNacional.date = $"{venta.fechaVenta:yyyy-MM-dd}";
                facturaNacional.time = $"{venta.fechaVenta:HH:mm:ss}";
            }
            else
            {
                facturaNacional.date = $"{DateTime.Today:yyyy-MM-dd}";
                facturaNacional.time = $"{DateTime.Today:HH:mm:ss}";
                /*en esta parte creamos la observacion*/
                string observacion = $"el servicio ó producto fue facturado el día {venta.fechaVenta:yyyy-MM-dd} pero con inconvenientes en el sistema de facturación ha sido aceptada por la DIAN el día {DateTime.Today:yyyy-MM-dd}";
                //enviamos la observicio a la api para agregarla a la tabla ventas
                var respAPI =await TablaVentaAPI.AgregarObservacion((int)venta.id,observacion);
                if (respAPI)
                {
                    venta.observacionVenta = observacion;
                }
                else
                {
                    venta.observacionVenta = "--";
                }
            }

            /* Metodos de Pago */
            facturaNacional.payment_forms = new List<RunApi.API_DIAN.Request.PaymentForms>();
            RunApi.API_DIAN.Request.PaymentForms paymentForms = new RunApi.API_DIAN.Request.PaymentForms();
            paymentForms.payment_method_id = Convert.ToInt32(venta.idMedioDePago);
            if (venta.formaDePago == "Contado")
            {
                paymentForms.payment_form_id = 1;
            }
            else
            {
                paymentForms.payment_form_id = 2;
            }
            paymentForms.duration_measure = Convert.ToInt32(venta.diasCredito);
            paymentForms.payment_due_date = venta.fechaVenta.Value.ToString("yyyy-MM-dd");
            facturaNacional.payment_forms.Add(paymentForms);


            //SQL.Model.Tables.Resoluciones resoluciones = new SQL.Model.Tables.Resoluciones();
            //resoluciones = Resoluciones_controler.Consultar_IdResolucion(Convert.ToInt32(v_TablaVentas.idResolucion));

            //facturaNacional.resolution = new Resolution();
            //facturaNacional.resolution.prefix = resoluciones.prefijo;
            //facturaNacional.resolution.type_document_id = 1;
            //facturaNacional.resolution.resolution = resoluciones.numeroResolucion;
            //facturaNacional.resolution.resolution_date =Convert.ToDateTime(resoluciones.fechaAvilitacion).ToString("yyyy-MM-dd");
            //facturaNacional.resolution.technical_key = resoluciones.technical_key;
            //facturaNacional.resolution.from =Convert.ToInt32(resoluciones.desde);
            //facturaNacional.resolution.to = Convert.ToInt32(resoluciones.hasta);
            //facturaNacional.resolution.date_from = Convert.ToDateTime(resoluciones.fechaAvilitacion).ToString("yyyy-MM-dd");
            //facturaNacional.resolution.date_to = Convert.ToDateTime(resoluciones.vigencia).ToString("yyyy-MM-dd");



            facturaNacional.customer = new RunApi.API_DIAN.Request.Customer();

            //en esta parte cargamos los datos del cliente
            V_Clientes clientes = new V_Clientes();
            clientes = getDataFactura_JSON.V_Clientes;
            if (clientes != null)
            {
                IdCliente_frm = (int)clientes.id;
                facturaNacional.customer.identification_number = clientes.identificationNumber;
                facturaNacional.customer.name = clientes.nameCliente;
                facturaNacional.customer.phone = clientes.phone;
                facturaNacional.customer.municipality_id = (int)clientes.municipality_id;
                facturaNacional.customer.address = clientes.adress;
                facturaNacional.customer.email = clientes.email;
                facturaNacional.customer.type_document_identification_id = (int)clientes.typeDocumentIdentification_id;
                facturaNacional.customer.type_organization_id = (int)clientes.typeOrganization_id;
                facturaNacional.customer.merchant_registration = "No tiene";
            }

            /*agregamos el descuento*/
            if (venta.propina > 0)
            {
                facturaNacional.allowance_charges = new List<AllowanceCharge>();
                if (venta.propina > 0)
                {
                    AllowanceCharge listaDescuentos = new AllowanceCharge();
                    listaDescuentos.charge_indicator = true;
                    listaDescuentos.discount_id = 1;
                    listaDescuentos.allowance_charge_reason = "Propina voluntaria por el cliente";
                    listaDescuentos.amount = $"{venta.propina}".Replace(",", ".");
                    listaDescuentos.base_amount = $"{venta.subtotalVenta}".Replace(",", ".");
                    facturaNacional.allowance_charges.Add(listaDescuentos);
                }
            }



            facturaNacional.legal_monetary_totals = new RunApi.API_DIAN.Request.LegalMonetaryTotals();

            facturaNacional.legal_monetary_totals.line_extension_amount = $"{venta.subtotalVenta}".Replace(",", ".");
            facturaNacional.legal_monetary_totals.tax_exclusive_amount = $"{venta.basesIva}".Replace(",", ".");
            facturaNacional.legal_monetary_totals.tax_inclusive_amount = $"{venta.totalVenta}".Replace(",", ".");
            facturaNacional.legal_monetary_totals.payable_amount = $"{venta.total_A_Pagar}".Replace(",", ".");

            facturaNacional.notes = new List<Notas>();



            if (venta.observacionVenta != string.Empty)
            {
                Notas itemNotas = new Notas();
                string NOTA = "";
                if (venta.observacionVenta == null)
                {
                    NOTA = "...";
                }
                else
                {
                    NOTA = venta.observacionVenta;
                }
                itemNotas.text = NOTA;
                facturaNacional.notes.Add(itemNotas);
            }



            facturaNacional.invoice_lines = new List<InvoiceLine>();


            //en esta parte tramor el listado de los productos
            List<V_DetalleCaja> dataTable = new List<V_DetalleCaja>();
            dataTable = getDataFactura_JSON.V_DetalleCaja;
            if (dataTable.Count > 0)
            {
                foreach (V_DetalleCaja row in dataTable)
                {

                    if (Convert.ToInt32(row.totalDetalle) > 0)
                    {
                        InvoiceLine itemDetalleFactura = new InvoiceLine();

                        itemDetalleFactura.unit_measure_id = 70;
                        itemDetalleFactura.invoiced_quantity = $"{row.unidad}".Replace(",", ".");
                        itemDetalleFactura.line_extension_amount = $"{row.subTotalDetalle}".Replace(",", ".");

                        /*cargamos los descuentos*/
                        itemDetalleFactura.allowance_charges = new List<AllowanceCharge_InvoiceLine>();
                        /*consultamos la lista de descuentos*/
                        //List<CargosDescuentosDetalleVenta> descuentos = new List<SQL.Model.Tables.CargosDescuentosDetalleVenta>();
                        //descuentos = CargosDescuentosDetalleVenta_controler.ConsultarLista(row.id);
                        //if (descuentos.Count > 0)
                        //{
                        //    foreach (SQL.Model.Tables.CargosDescuentosDetalleVenta descu in descuentos)
                        //    {
                        //        AllowanceCharge_InvoiceLine allowanceCharge = new AllowanceCharge_InvoiceLine();
                        //        allowanceCharge.charge_indicator = false;
                        //        allowanceCharge.allowance_charge_reason = "Descuento";
                        //        allowanceCharge.amount = descu.valorDescuento;
                        //        allowanceCharge.base_amount = row.precioVenta + descu.valorDescuento;
                        //        itemDetalleFactura.allowance_charges.Add(allowanceCharge);
                        //    }

                        //}

                        itemDetalleFactura.tax_totals = new List<RunApi.API_DIAN.Request.TaxTotal>();
                        decimal ivaDetalle = Convert.ToDecimal(row.porImpuesto);
                        if (row.impuesto_id != 24)
                        {

                            RunApi.API_DIAN.Request.TaxTotal taxTotalItem = new RunApi.API_DIAN.Request.TaxTotal();

                            taxTotalItem.tax_id = Convert.ToInt32(row.impuesto_id);
                            taxTotalItem.tax_amount = $"{row.valorImpuesto}".Replace(",", ".");
                            taxTotalItem.taxable_amount = $"{row.baseImpuesto}".Replace(",", ".");
                            string iva = Convert.ToString(row.porImpuesto);
                            int xx = Convert.ToInt32(Convert.ToDecimal(iva) * 100);
                            taxTotalItem.percent = $"{xx}.00";

                            itemDetalleFactura.tax_totals.Add(taxTotalItem);
                        }


                        itemDetalleFactura.description = Convert.ToString(row.nombreProducto);
                        itemDetalleFactura.code = Convert.ToString(row.codigoProducto);
                        itemDetalleFactura.type_item_identification_id = 3;
                        itemDetalleFactura.price_amount = $"{row.precioVenta}".Replace(",", ".");
                        itemDetalleFactura.base_quantity = "1.000000";

                        facturaNacional.invoice_lines.Add(itemDetalleFactura);
                    }

                }
            }


            if (venta.descuentoVenta > 0)
            {
                facturaNacional.allowance_charges = new List<AllowanceCharge>();
                AllowanceCharge allowanceCharge = new AllowanceCharge();
                allowanceCharge.discount_id = 1;
                allowanceCharge.charge_indicator = false;
                allowanceCharge.allowance_charge_reason = "Descuento";
                allowanceCharge.amount = Convert.ToInt32(venta.descuentoVenta).ToString();
                allowanceCharge.base_amount = Convert.ToInt32(venta.subtotalVenta).ToString();

                facturaNacional.allowance_charges.Add(allowanceCharge);
            }

            var token = await HistorialVentasAPI.ConsultarToken();
            // Esto solo enviar cuando estamos en pruebas.
            //if (VariablesPublicas.IdAmbiente == 2)
            //{
            //    facturaNacional.testSetID = VariablesPublicas.TextID;
            //    facturaNacional.sync = VariablesPublicas.FEH;
            //}
            //else
            //{
            //    facturaNacional.sync = true;
            //}

            facturaNacional.sync = true;

            /****************************************************************************/
            /****************************************************************************/
            /****************************************************************************/
            /****************************************************************************/
            var url = $"/api/ubl2.1/invoice/";
            var json = JsonConvert.SerializeObject(facturaNacional);
            var rspuestaAPI = await classAPI.HttpWebRequestPostAsync(url,json,HttpMethod.Post,true,token.Replace("\"", ""));

            FacturaElectronica_Respons facturaNacionalRespuesta = JsonConvert.DeserializeObject<FacturaElectronica_Respons>(rspuestaAPI);
            //en esta parte preguntamos si es valido
            if (facturaNacionalRespuesta != null)
            {
                
                FacturaElectronicaJSON facturaelectronicaJSON = new FacturaElectronicaJSON();
                facturaelectronicaJSON.id = 0;
                facturaelectronicaJSON.idventa = (int)venta.id;
                facturaelectronicaJSON.is_valid = facturaNacionalRespuesta.is_valid;
                if (facturaNacionalRespuesta.is_restored == null)
                {
                    facturaelectronicaJSON.is_restored = false;
                }
                else
                {
                    facturaelectronicaJSON.is_restored = (bool)facturaNacionalRespuesta.is_restored;
                }
                
                facturaelectronicaJSON.algorithm = (string)(facturaNacionalRespuesta.algorithm ?? "--");
                facturaelectronicaJSON.zip_key = (string)(facturaNacionalRespuesta.zip_key ?? "--");
                facturaelectronicaJSON.status_code = (facturaNacionalRespuesta.status_code ?? "--");
                facturaelectronicaJSON.status_description = (facturaNacionalRespuesta.status_description ?? "--");
                facturaelectronicaJSON.status_message = (facturaNacionalRespuesta.status_message ?? "--");
                facturaelectronicaJSON.mail_sending_message = (string)(facturaNacionalRespuesta.mail_sending_message ?? "--");
                if (facturaNacionalRespuesta.errors_messages != null)
                {
                    if (facturaNacionalRespuesta.errors_messages.Count > 0)
                    {
                        foreach (var listmsg in facturaNacionalRespuesta.errors_messages)
                        {
                            facturaelectronicaJSON.errors_messages = $"{facturaelectronicaJSON.errors_messages};{listmsg}";
                        }
                    }
                    else
                    {
                        facturaelectronicaJSON.errors_messages = "";
                    }
                }
                else
                {
                    facturaelectronicaJSON.errors_messages = "";
                }
                facturaelectronicaJSON.xml_name = (string)(facturaNacionalRespuesta.xml_name ?? "--");
                facturaelectronicaJSON.zip_name = (string)(facturaNacionalRespuesta.zip_name ?? "--");
                facturaelectronicaJSON.signature = (string)(facturaNacionalRespuesta.signature ?? "--");
                facturaelectronicaJSON.qr_code = (string)(facturaNacionalRespuesta.qr_code ?? "--");
                facturaelectronicaJSON.qr_link = (string)(facturaNacionalRespuesta.qr_link ?? "--");
                facturaelectronicaJSON.pdf_download_link = (string)(facturaNacionalRespuesta.pdf_download_link ?? "--");
                facturaelectronicaJSON.xml_base64_bytes = (string)(facturaNacionalRespuesta.xml_base64_bytes ?? "--");
                facturaelectronicaJSON.application_response_base64_bytes = (string)(facturaNacionalRespuesta.application_response_base64_bytes ?? "--");
                facturaelectronicaJSON.attached_document_base64_bytes = (string)(facturaNacionalRespuesta.attached_document_base64_bytes ?? "--");
                facturaelectronicaJSON.pdf_base64_bytes = (string)(facturaNacionalRespuesta.pdf_base64_bytes ?? "--");
                facturaelectronicaJSON.zip_base64_bytes = (string)(facturaNacionalRespuesta.zip_base64_bytes ?? "--");
                facturaelectronicaJSON.type_environment_id = facturaNacionalRespuesta.type_environment_id;

                InsertIntoRequest insertIntoRequest = new InsertIntoRequest();
                insertIntoRequest.nombreDB = ClassDBCliente.DBCliente;
                insertIntoRequest.FacturaElectronicaJSON = facturaelectronicaJSON;

                var res2 =await FacturaElectronicaJSONAPI.InsertInto(JsonConvert.SerializeObject(insertIntoRequest));

                string jsonxx = JsonConvert.SerializeObject(insertIntoRequest);

                //en esta parte guardamos la FacturaElectronica
                FacturaElectronica fe = new FacturaElectronica();
                //primero consultamos el idventa en la factura
                var objetofe = new
                {
                    nombreDB = ClassDBCliente.DBCliente,
                    idventa = venta.id
                };
                fe = await FacturaElectronicaAPI.ConsultarIdVenta(JsonConvert.SerializeObject(objetofe));
                int funcionfe = 0;
                if (fe != null)
                {
                    funcionfe = 1;
                }
                else
                {
                    fe = new FacturaElectronica();
                    fe.id = 0;
                }
                fe.idVenta = (int)venta.id;
                fe.cufe = (string)(facturaNacionalRespuesta.uuid ?? "--");
                fe.numeroFactura = (facturaNacionalRespuesta.number ?? "--");
                fe.fechaEmision = (string)(facturaNacionalRespuesta.expedition_date ?? "--");
                fe.fecahVensimiento = (string)(facturaNacionalRespuesta.expedition_date ?? "--");
                fe.dataQR = (string)(facturaNacionalRespuesta.qr_data ?? "--");
                fe.imagenQR = "--";
                fe.resolucion_id = (int)venta.idResolucion;
                fe.prefijo = venta.prefijo;
                fe.numero_factura =Convert.ToInt32(facturaNacionalRespuesta.number.Replace(venta.prefijo, ""));
                var facturaelectronicaenvio = new FacturaElectronicaEnvio();
                facturaelectronicaenvio.nombreDB = ClassDBCliente.DBCliente;
                facturaelectronicaenvio.facturaElectronica = fe;
                var respuestaCRUD_FacturaElectronica = await FacturaElectronicaAPI.CRUD(facturaelectronicaenvio);
                if (respuestaCRUD_FacturaElectronica.estado)
                {
                    
                    var tv = await TablaVentaAPI.EditarConsecutivo((int)venta.id, fe.numero_factura);
                }
            }
            return JsonConvert.SerializeObject(facturaNacionalRespuesta);
        }
        public static async Task<Respuesta_ApiDIAN> NotaCreditoElectronica (int IdVenta)
        {
            try
            {
                //traemos toda la información relacionada con la factura
                GetDataFactura_JSON getDataFactura_JSON = new GetDataFactura_JSON();
                getDataFactura_JSON = await GetDataFactura_JSON_API.DataFactura(IdVenta);
                if (getDataFactura_JSON == null)
                {
                    return new Respuesta_ApiDIAN { data = null, estado = false, mensaje = $"no se encontraron los datos de la factura." };
                }
                //cargamos el objeto ventas
                var venta = getDataFactura_JSON.V_TablaVentas;
                //llamamos al objeto que carga toda la data que se requiere para la nota crédito
                var notacredito = new NotaCreditoRequest();

                notacredito.sync = true;

                notacredito.discrepancy_response = new NotaCreditoRequest.DiscrepancyResponse();
                notacredito.discrepancy_response.correction_concept_id = 2;

                //consultamos la resolución
                var resolucion =await V_ResolucionesControler.ConsultarIdResolucion((int)venta.idResolucion);
                if (resolucion == null || resolucion.id==null)
                {
                    return new Respuesta_ApiDIAN { data = null, estado = false, mensaje = $"no se encontró el IdResolucion ({venta.idResolucion})." };
                }
                notacredito.resolution.prefix = $"{resolucion.prefijo}";
                notacredito.resolution.from = Convert.ToInt32(resolucion.desde);
                notacredito.resolution.to = Convert.ToInt32(resolucion.hasta);

                var facturaElectronica=new FacturaElectronica();
                var objeto = new { nombreDB=ClassDBCliente.DBCliente, idventa=venta.id };
                string jsonFE = JsonConvert.SerializeObject(objeto);
                facturaElectronica =await FacturaElectronicaAPI.ConsultarIdVenta(jsonFE);

                notacredito.billing_reference = new NotaCreditoRequest.BillingReference();
                notacredito.billing_reference.number = facturaElectronica.numeroFactura;
                notacredito.billing_reference.uuid = facturaElectronica.cufe;
                notacredito.billing_reference.issue_date = Convert.ToDateTime(facturaElectronica.fechaEmision).ToString("yyyy-MM-dd");

                notacredito.number = (int)venta.numeroVenta;
                notacredito.type_document_id = 5;

                /* Metodos de Pago */
                notacredito.payment_forms = new List<PaymentForms_NC>();
                PaymentForms_NC paymentForms = new PaymentForms_NC();
                paymentForms.payment_method_id = Convert.ToInt32(venta.idMedioDePago);
                if (venta.idFormaDePago == 1)
                {
                    paymentForms.payment_form_id = 1;
                }
                else
                {
                    paymentForms.payment_form_id = 2;
                }
                paymentForms.duration_measure = Convert.ToInt32(venta.diasCredito);
                paymentForms.payment_due_date = Convert.ToDateTime(venta.fechaVenta).ToString("yyyy-MM-dd");
                notacredito.payment_forms.Add(paymentForms);

                notacredito.customer = new Customer_NC();

                //en esta parte cargamos los datos del cliente
                var clientes = new V_Clientes();
                clientes = getDataFactura_JSON.V_Clientes;
                if (clientes != null)
                {
                    notacredito.customer.identification_number = clientes.identificationNumber;
                    notacredito.customer.name = clientes.nameCliente;
                    notacredito.customer.phone = clientes.phone;
                    notacredito.customer.municipality_id = (int)clientes.municipality_id;
                    notacredito.customer.address = clientes.adress;
                    notacredito.customer.email = clientes.email;
                    notacredito.customer.type_document_identification_id = (int)clientes.typeDocumentIdentification_id;
                    notacredito.customer.type_organization_id = (int)clientes.typeOrganization_id;
                    notacredito.customer.merchant_registration = "No tiene";
                }

                notacredito.legal_monetary_totals = new LegalMonetaryTotals_NC();

                notacredito.legal_monetary_totals.line_extension_amount = $"{Convert.ToInt32(venta.subtotalVenta)}.00";
                notacredito.legal_monetary_totals.tax_exclusive_amount = $"{Convert.ToInt32(venta.basesIva)}.00";
                notacredito.legal_monetary_totals.tax_inclusive_amount = $"{Convert.ToInt32(venta.subtotalVenta) + Convert.ToInt32(venta.ivaVenta)}.00";
                notacredito.legal_monetary_totals.payable_amount = $"{Convert.ToInt32(venta.subtotalVenta) + Convert.ToInt32(venta.ivaVenta)}.00";

                notacredito.notes = new List<Notas_NC>();

                if (venta.observacionVenta != string.Empty)
                {
                    Notas_NC itemNotas = new Notas_NC();
                    string NOTA = "";
                    if (venta.observacionVenta == null)
                    {
                        NOTA = "...";
                    }
                    else
                    {
                        NOTA = venta.observacionVenta;
                    }
                    itemNotas.text = NOTA;
                    notacredito.notes.Add(itemNotas);
                }



                notacredito.credit_note_lines = new List<CreditNoteLines>();

                //en esta parte tramor el listado de los productos
                List<V_DetalleCaja> dataTable = new List<V_DetalleCaja>();
                dataTable = getDataFactura_JSON.V_DetalleCaja;
                if (dataTable.Count > 0)
                {
                    foreach (V_DetalleCaja row in dataTable)
                    {
                        CreditNoteLines itemDetalleFactura = new CreditNoteLines();

                        itemDetalleFactura.unit_measure_id = 70;
                        itemDetalleFactura.invoiced_quantity = Convert.ToString(Convert.ToInt32(row.unidad));
                        itemDetalleFactura.line_extension_amount = Convert.ToString(Convert.ToInt32(row.subTotalDetalle)) + ".00";

                        itemDetalleFactura.tax_totals = new List<RunApi.API_DIAN.Request.TaxTotal>();
                        decimal ivaDetalle = Convert.ToDecimal(row.porImpuesto);
                        if (ivaDetalle > Convert.ToDecimal(0))
                        {

                            RunApi.API_DIAN.Request.TaxTotal taxTotalItem = new RunApi.API_DIAN.Request.TaxTotal();

                            taxTotalItem.tax_id = Convert.ToInt32(row.impuesto_id);
                            taxTotalItem.tax_amount = Convert.ToString(Convert.ToInt32(row.valorImpuesto)) + ".00";
                            taxTotalItem.taxable_amount = Convert.ToString(Convert.ToInt32(row.baseImpuesto)) + ".00";
                            string iva = Convert.ToString(row.porImpuesto).Replace("0,", "");
                            taxTotalItem.percent = Convert.ToString(Convert.ToInt32(iva)) + ".00";

                            itemDetalleFactura.tax_totals.Add(taxTotalItem);
                        }

                        int caracteres = Convert.ToString(row.nombreProducto).Length;
                        string textoCorto = new string(row.nombreProducto.Take(50).ToArray());

                        itemDetalleFactura.description = textoCorto;
                        itemDetalleFactura.code = Convert.ToString(row.codigoProducto);
                        itemDetalleFactura.type_item_identification_id = 3;
                        itemDetalleFactura.price_amount = Convert.ToString(Convert.ToInt32(row.precioVenta)) + ".00";
                        itemDetalleFactura.base_quantity = "1.000000";

                        notacredito.credit_note_lines.Add(itemDetalleFactura);
                    }
                }


                if (venta.descuentoVenta > 0)
                {
                    notacredito.allowance_charges = new List<AllowanceCharge_NC>();
                }

                /****************************************************************************/
                /****************************************************************************/
                /****************************************************************************/
                /****************************************************************************/
                var api =new ClassAPI();
                var url = $"/api/ubl2.1/credit-note/";
                string jsonNotaCredito = JsonConvert.SerializeObject(notacredito);
                var token =await HistorialVentasAPI.ConsultarToken();
                string respuestaNotaCredito = await api.HttpWebRequestPostAsync(url,jsonNotaCredito,HttpMethod.Post,true, token.Replace("\"", ""));
                var notaCreditoResponse=JsonConvert.DeserializeObject<NotaCreditoResponse>(respuestaNotaCredito);

                if (notaCreditoResponse == null) 
                {
                    return new Respuesta_ApiDIAN { data = null, estado = false, mensaje = $"error en el proceso de enviar la nota crédito a la DIAN." };
                }

                if ((bool)notaCreditoResponse.is_valid)
                {
                    //guardamos la data en la base de datos
                    var objNotaCredito = new NotasCredito();
                    objNotaCredito.id = 0;
                    objNotaCredito.idVenta = IdVenta;
                    objNotaCredito.cufe = (string)notaCreditoResponse.uuid;
                    objNotaCredito.numeroFactura = notaCreditoResponse.number;
                    objNotaCredito.fechaEmision = (string)notaCreditoResponse.issue_date;
                    objNotaCredito.fecahVensimiento = (string)notaCreditoResponse.expedition_date;
                    objNotaCredito.dataQR = (string)notaCreditoResponse.qr_data;
                    objNotaCredito.imagenQR =GeneralQR.GenerarQrBase64((string)notaCreditoResponse.qr_data);
                    var crudRequest=new CRUD_NotaCreditoRequest { funcion=0, nombreDB=ClassDBCliente.DBCliente, NotasCredito=objNotaCredito};
                    var respCRUD = await NotaCreditoAPI.CRUD(crudRequest);

                    //como la nota crédito fue aprobada por la DIAN entonces enviamos la nota crédito al correo del cliente
                    var correoRequest=new CorreoRequest();
                    correoRequest.to = new List<RunApi.API_DIAN.Request.To>();
                    RunApi.API_DIAN.Request.To toCorreo = new RunApi.API_DIAN.Request.To();
                    toCorreo.email = clientes.email;
                    correoRequest.to.Add(toCorreo);

                    correoRequest.cc = new List<RunApi.API_DIAN.Request.Cc>();
                    List<V_CorreosCliente> v_CorreosCliente = new List<V_CorreosCliente>();
                    v_CorreosCliente = await V_CorreosClienteControler.ListaIdCliente(clientes.id);
                    if (v_CorreosCliente.Count > 0)
                    {
                        foreach (V_CorreosCliente correos in v_CorreosCliente)
                        {
                            RunApi.API_DIAN.Request.Cc CcCorreo = new RunApi.API_DIAN.Request.Cc();
                            CcCorreo.email = correos.email;
                            correoRequest.cc.Add(CcCorreo);
                        }
                    }

                    correoRequest.bcc = new List<RunApi.API_DIAN.Request.Bcc>();
                    RunApi.API_DIAN.Request.Bcc bccCorreo = new RunApi.API_DIAN.Request.Bcc();
                    bccCorreo.email = "facturacion@serinsispc.com";
                    correoRequest.bcc.Add(bccCorreo);

                    var respCorreo =await FacturaMail(correoRequest,token, (string)notaCreditoResponse.uuid);
                    if(respCorreo != null)
                    {
                        if (!(bool)respCorreo.is_valid)
                        {
                            return new Respuesta_ApiDIAN { data = respuestaNotaCredito, estado = true, mensaje = $"Nota crédito aceptada, pero error en el envió del correo" };
                        }
                    }
                    else
                    {
                        return new Respuesta_ApiDIAN { data = respuestaNotaCredito, estado = true, mensaje = $"Nota crédito aceptada, pero error en el envió del correo" };
                    }
                }
                else
                {
                    return new Respuesta_ApiDIAN { data = respuestaNotaCredito, estado = false, mensaje = $"La nota crédito no fue aceptada por la DIAN." };
                }
                return new Respuesta_ApiDIAN { data = respuestaNotaCredito, estado = true, mensaje = $"proceso de nota crédito finalizado con éxito." };
            }
            catch(Exception ex)
            {
                string msg = ex.Message;
                return new Respuesta_ApiDIAN { data = null, estado = false, mensaje=$"ocurrió el siguiente error en el proceso del envió de la nota crédito: {msg}" };
            }
        } 
        public static async Task<CorreoResponse> FacturaMail(CorreoRequest correoRequest,string token,string uuid)
        {
            try
            {
                var api = new ClassAPI();
                var url = $"/api/ubl2.1/mail/send/{uuid}";
                string json=JsonConvert.SerializeObject(correoRequest);
                json = json.Replace("\"allowance_charges\":null,", "");
                var resp = await api.HttpWebRequestPostAsync(url, json, HttpMethod.Post,true,token);
                return JsonConvert.DeserializeObject<CorreoResponse>(resp);
            }
            catch (Exception ex) 
            { 
                string error=ex.Message;
                return new CorreoResponse();
            }
        }
    }
}
