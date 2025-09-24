using RunApi.ApiControlers;
using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.Remoting.Contexts;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using WebCliente.ViewModels;

namespace WebCliente.Controllers
{
    public class InformesController : Controller
    {
        // GET: Informes
        public async Task<ActionResult> Index()
        {
            return View(await CargarModelLoad());
        }
        private async Task<InformesViewModels> CargarModelLoad()
        {
            InformesViewModels model = new InformesViewModels();
            List<TablaMeses> meses = new List<TablaMeses>();
            meses = await TablaMesesControler.listaMeses();
            model.tablaMeses = meses;
            model.yearSeleccionado = DateTime.Now.Year;
            model.monthSeleccionado = DateTime.Now.Month;
            model.day1Seleccionado = DateTime.Now.Day;
            model.day2Seleccionado = DateTime.Now.Day;
            return model;
        }
    }
}