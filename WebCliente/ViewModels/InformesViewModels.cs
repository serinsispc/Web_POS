using RunApi.Models.Cliente;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;

namespace WebCliente.ViewModels
{
    public class InformesViewModels
    {
        public int yearSeleccionado {  get; set; }
        public int monthSeleccionado {  get; set; }
        public int day1Seleccionado {  get; set; }
        public int day2Seleccionado {  get; set; }
        public List<TablaMeses> tablaMeses {  get; set; }
    }
}