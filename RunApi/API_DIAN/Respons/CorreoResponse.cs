using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN.Respons
{
    public class CorreoResponse
    {
        public string message { get; set; }
        public bool? is_valid { get; set; }
        public List<To> to { get; set; }
        public List<Cc> cc { get; set; }
        public List<Bcc> bccs { get; set; }
        public string pdf_base64_bytes { get; set; }
    }
    public class To
    {
        public string email { get; set; }
    }
    public class Cc
    {
        public string email { get; set; }
    }
    public class Bcc
    {
        public string email { get; set; }
    }
}
