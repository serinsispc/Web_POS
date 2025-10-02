using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace RunApi.API_DIAN.Request
{
    public class CorreoRequest
    {
        public List<To> to { get; set; }
        public List<Cc> cc { get; set; }
        public List<Bcc> bcc { get; set; }
        public string pdf_base64_bytes { get; set; }
        public Annexes annexes { get; set; }
    }
    public class Annexes
    {
        public string name { get; set; }
        public string base64_bytes { get; set; }
    }
    public class Bcc
    {
        public string email { get; set; }
    }
    public class Cc
    {
        public string email { get; set; }
    }
    public class To
    {
        public string email { get; set; }
    }
}
