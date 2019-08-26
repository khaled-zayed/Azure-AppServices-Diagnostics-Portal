using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace AppLensV3.Controllers
{
    /// <summary>
    /// Testers Access controller.
    /// </summary>
    [Route("api/hasTestersAccess")]
    [Authorize(Policy = "ApplensAccess")]
    [Authorize(Policy = "ApplensTesters")]
    public class TestersAccessController : Controller
    {
        /// <summary>
        /// Method to check testers access.
        /// </summary>
        /// <returns>True result.</returns>
        [HttpGet]
        [HttpOptions]
        public IActionResult CheckTestersAccess(){
            return new ObjectResult(true);
        }
    }
}
