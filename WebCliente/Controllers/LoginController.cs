using Newtonsoft.Json;
using RunApi;
using RunApi.Envio;
using RunApi.Models.Admin;
using RunApi.Models.Cliente;
using RunApi.Respuesta;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Web;
using System.Web.Mvc;
using System.Web.UI.WebControls;
using System.Xml.Linq;

namespace WebCliente.Controllers
{
    public class LoginController : Controller
    {
        // GET: Login
        public ActionResult Index()
        {
            if (Session["usuario"] != null)
            {
                return RedirectToAction("Index","Menu");
            }
            return View();
        }
        [HttpPost]
        public async Task<ActionResult> Index(string usuario,string clave)
        {
            if (usuario != null && clave != null) 
            {
                UsuarioAdminEnvio usuarioAdminEnvio = new UsuarioAdminEnvio();
                usuarioAdminEnvio.nombreDB = "DBAdminSerinsisPC";
                usuarioAdminEnvio.usuario = usuario;
                usuarioAdminEnvio.clave = clave;
                usuarioAdminEnvio.idTipoSistema = 1;
                UsuarioAdminRespuesta usuarioAdminRespuesta = new UsuarioAdminRespuesta();
                ClassAPI aPI = new ClassAPI();
                usuarioAdminRespuesta=await aPI.LoginAdmin(usuarioAdminEnvio);
                if(usuarioAdminRespuesta != null && usuarioAdminRespuesta.v_UsuarioDB!=null)
                {
                    Session["usuario"] = usuarioAdminRespuesta;
                    if (usuarioAdminRespuesta.v_UsuarioDB.Count > 1)
                    {
                        Session["usuarioAdmin"] = usuarioAdminRespuesta.usuarioAdmin;
                        /*mostramos el listado de las bases de datos disponibles*/
                        return View("ListaDB", usuarioAdminRespuesta.v_UsuarioDB);
                    }
                    if (usuarioAdminRespuesta.v_UsuarioDB.Count == 1)
                    {
                        LoginEnviar loginEnviar = new LoginEnviar();
                        loginEnviar.idUsuario = usuarioAdminRespuesta.usuarioAdmin.idUsuario;
                        loginEnviar.guidUsuario = usuarioAdminRespuesta.usuarioAdmin.guidUsuario;
                        loginEnviar.nombreUsuario = usuarioAdminRespuesta.usuarioAdmin.nombreUsuario;
                        loginEnviar.cedulaUsuario = usuarioAdminRespuesta.usuarioAdmin.cedulaUsuario;
                        loginEnviar.celularUsuario = usuarioAdminRespuesta.usuarioAdmin.celularUsuario;
                        loginEnviar.cuentaUSuario = usuarioAdminRespuesta.usuarioAdmin.cuentaUSuario;
                        loginEnviar.claveUsuario = usuarioAdminRespuesta.usuarioAdmin.claveUsuario;
                        loginEnviar.idTipoUSuario = usuarioAdminRespuesta.usuarioAdmin.idTipoUSuario;
                        loginEnviar.nombreDB = usuarioAdminRespuesta.v_UsuarioDB.FirstOrDefault().nombreDB;
                        loginEnviar.idTipoSistema = 1;
                        aPI = new ClassAPI();
                        LoginRespuesta respuesta  = await aPI.Login(loginEnviar);
                        v_Usuario_POS usuarioPOS= new v_Usuario_POS();
                        usuarioPOS = respuesta.v_Usuario;
                        if (usuarioPOS.idTipoUsuario == 1)
                        {
                            Session["admin"] = true;
                        }
                        else
                        {
                            Session["admin"] = false;
                        }
                        Session["db"] = loginEnviar.nombreDB;
                        Session["usuario"] = JsonConvert.SerializeObject(respuesta);
                        return RedirectToAction("Index", "Menu");
                    }
                }
            }
            return View();
        }
        [HttpGet]
        public  ActionResult ListaDB(List<V_UsuarioDB> v_UsuarioDBs)
        {
            return View(v_UsuarioDBs);
        }
        [HttpPost]
        public async Task<ActionResult> SeleccionarDB(string dbName)
        {
            var usuarioAdminRespuesta = Session["usuarioAdmin"] as UsuarioAdmin;
            LoginEnviar loginEnviar = new LoginEnviar();
            loginEnviar.idUsuario = usuarioAdminRespuesta.idUsuario;
            loginEnviar.guidUsuario = usuarioAdminRespuesta.guidUsuario;
            loginEnviar.nombreUsuario = usuarioAdminRespuesta.nombreUsuario;
            loginEnviar.cedulaUsuario = usuarioAdminRespuesta.cedulaUsuario;
            loginEnviar.celularUsuario = usuarioAdminRespuesta.celularUsuario;
            loginEnviar.cuentaUSuario = usuarioAdminRespuesta.cuentaUSuario;
            loginEnviar.claveUsuario = usuarioAdminRespuesta.claveUsuario;
            loginEnviar.idTipoUSuario = usuarioAdminRespuesta.idTipoUSuario;
            loginEnviar.nombreDB = dbName;
            loginEnviar.idTipoSistema = 1;

            ClassAPI aPI = new ClassAPI();
            LoginRespuesta respuesta = await aPI.Login(loginEnviar);
            Session["usuario"] = JsonConvert.SerializeObject(respuesta);
            Session["db"] = dbName;
            return RedirectToAction("Index", "Menu");
        }
        [HttpGet]
        public ActionResult ElegirSistema()
        {
            return View();
        }
    }
}