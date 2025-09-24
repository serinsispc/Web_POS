using Newtonsoft.Json;
using RunApi.Envio;
using RunApi.Models.Admin;
using RunApi.Respuesta;
using RunApi;
using System.Collections.Generic;
using System.Threading.Tasks;
using System.Web.Mvc;
using System.Linq;

namespace WebCliente.Controllers
{
    public class LoginParqueaderoController : Controller
    {
        // GET: LoginParqueadero
        public ActionResult Index()
        {
            if (Session["usuario"] != null)
            {
                return RedirectToAction("Index", "Menu");
            }
            return View();
        }

        [HttpPost]
        public async Task<ActionResult> Index(string usuario, string clave)
        {
            if (usuario != null && clave != null)
            {
                UsuarioAdminEnvio usuarioAdminEnvio = new UsuarioAdminEnvio();
                usuarioAdminEnvio.usuario = usuario;
                usuarioAdminEnvio.clave = clave;
                usuarioAdminEnvio.idTipoSistema = 2;
                UsuarioAdminRespuesta usuarioAdminRespuesta = new UsuarioAdminRespuesta();
                ClassAPI aPI = new ClassAPI();
                usuarioAdminRespuesta = await aPI.LoginAdmin(usuarioAdminEnvio);
                if (usuarioAdminRespuesta != null)
                {
                    Session["usuario"] = usuarioAdminRespuesta;
                    if (usuarioAdminRespuesta.v_UsuarioDB.Count > 1)
                    {
                        Session["usuarioAdmin"] = usuarioAdminRespuesta.usuarioAdmin;
                        /*mostramos el listado de las bases de datos disponibles*/
                        return View("ListaDBp", usuarioAdminRespuesta.v_UsuarioDB);
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
                        aPI = new ClassAPI();
                        LoginRespuesta respuesta = await aPI.Login(loginEnviar);
                        Session["usuario"] = JsonConvert.SerializeObject(respuesta);
                        return RedirectToAction("Index", "Menu");
                    }
                }
            }
            return View();
        }
        [HttpGet]
        public ActionResult ListaDBp(List<V_UsuarioDB> v_UsuarioDBs)
        {
            return View(v_UsuarioDBs);
        }
        [HttpPost]
        public async Task<ActionResult> SeleccionarDBp(string dbName)
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

            ClassAPI aPI = new ClassAPI();
            LoginRespuesta respuesta = await aPI.Login(loginEnviar);
            Session["usuario"] = JsonConvert.SerializeObject(respuesta);
            return RedirectToAction("Index", "Parqueo");
        }
    }
}
