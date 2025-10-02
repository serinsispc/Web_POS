using QRCoder;
using System;
using System.Threading.Tasks;

namespace RunApi.Utilidades
{
    public static class GeneralQR
    {
        /// <summary>
        /// Genera un QR en PNG (bytes) y lo retorna como Base64.
        /// No usa System.Drawing. Útil para APIs/servicios.
        /// </summary>
        public static string GenerarQrBase64(string contenido)
        {
            try
            {
                var generator = new QRCodeGenerator();
                var data = generator.CreateQrCode(contenido, QRCodeGenerator.ECCLevel.H);

                var qr = new PngByteQRCode(data);
                byte[] pngBytes = qr.GetGraphic(pixelsPerModule: 10); // tamaño de los módulos

                return Convert.ToBase64String(pngBytes);
            }
            catch (Exception ex)
            {
                // Loguea el error si quieres
                return $"Error: {ex.Message}";
            }
        }

        // Wrapper para mantener tu firma original (aunque no es necesario que sea async)
        public static Task<string> General_qr(string qr, int IdVenta_frm)
            => Task.FromResult(GenerarQrBase64(qr));
    }
}
