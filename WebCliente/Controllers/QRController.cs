using QRCoder;
using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;

namespace WebCliente.Controllers
{
    public class QRController : Controller
    {
        // GET: QR
        public ActionResult Index()
        {
            string db = Session["db"].ToString();
            // Construimos el link que tendrá el QR
            string linkQr = "https://serinsispc.com/Comandas/Login?db=" + db;
            ViewBag.LinkQr = linkQr;
            ViewBag.Db = db;

            return View();
        }
        // Action que devuelve el PNG del QR
        public ActionResult Generar(string url)
        {
            using (var qrGenerator = new QRCodeGenerator())
            using (var qrData = qrGenerator.CreateQrCode(url, QRCodeGenerator.ECCLevel.Q))
            using (var qrCode = new QRCode(qrData))
            using (var bitmap = qrCode.GetGraphic(20))
            using (var stream = new MemoryStream())
            {
                bitmap.Save(stream, System.Drawing.Imaging.ImageFormat.Png);
                return File(stream.ToArray(), "image/png");
            }
        }
    }
}