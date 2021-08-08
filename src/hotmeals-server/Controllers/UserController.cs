using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;

using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;
using hotmeals_server.Model;

namespace hotmeals_server.Controllers
{
    /// <summary>
    /// Authentication controller. Takes care of logging in.
    /// </summary>
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class UserController : BaseController
    {

        ILogger<AuthController> _log;
        private IConfiguration _config;

        public UserController(ILogger<AuthController> logger, IConfiguration config)
        {
            _log = logger;
            _config = config;
        }

        /// <summary>
        /// Authenticates the user and provides authentication cookie in the response.
        /// </summary>
        /// <param name="login">Login request data</param>
        /// <returns></returns>
        [HttpGet("current")]
        public async Task<UserDTO> GetCurrentUser()
        {
            return new UserDTO(this.CurrentUser.Email, "Test", "Name", false);
        }
    }
}
