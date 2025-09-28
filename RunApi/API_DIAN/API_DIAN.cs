using Newtonsoft.Json;
using RunApi.API_DIAN;
using RunApi.API_DIAN.Request;
using RunApi.API_DIAN.Respons;
using RunApi.ApiControlers;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Data.SqlTypes;
using System.Linq;
using System.Net.Http;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading.Tasks;

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
            facturaNacional.payment_forms = new List<PaymentForms>();
            PaymentForms paymentForms = new PaymentForms();
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
                if (facturaNacionalRespuesta.is_valid)
                {

                }
            }
            return JsonConvert.SerializeObject(facturaNacionalRespuesta);
        }
    }
}
