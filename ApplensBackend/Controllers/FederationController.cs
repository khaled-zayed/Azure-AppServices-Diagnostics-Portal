using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Use this class as a placeholder to invoke federation login.
    /// </summary>
    [Route("federation")]
    [Authorize]
    public class FederationController : Controller
    {
        [HttpGet("signin")]
        public async Task<IActionResult> SignIn()
        {
            return Ok();
        }
    }
}
