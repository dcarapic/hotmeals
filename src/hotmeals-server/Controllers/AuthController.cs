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
    [AllowAnonymous]
    public class AuthController : BaseController
    {

        ILogger<AuthController> _log;
        private IConfiguration _config;

        public AuthController(ILogger<AuthController> logger, IConfiguration config)
        {
            _log = logger;
            _config = config;
        }

        /// <summary>
        /// Authenticates the user and provides authentication cookie in the response.
        /// </summary>
        /// <param name="login">Login request data</param>
        /// <returns></returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest login)
        {
            if (login == null || string.IsNullOrEmpty(login.Email))
            {
                _log.LogWarning("Invalid email", login?.Email);
                return BadRequest("Please provide a valid email address!");
            }
            if (string.IsNullOrEmpty(login.Password))
            {
                _log.LogWarning("Invalid password", login?.Email);
                return BadRequest("Please provide password!");
            }
            // TODO: Load from DB
            var user = new CurrentUserData(Guid.Empty, login.Email);
            _log.LogDebug("User {Email} logged in", user.Email);
            
            await AddAuthenticationCookie(user);
            
            return Ok(new UserResponse(
                Email: user.Email,
                FirstName: "Test",
                LastName: "Name",
                AddressCityZip: "10000",
                AddressCity: "City",
                AddressStreet: "Street",
                IsRestaurantOwner: false));
        }

        /// <summary>
        /// Logout simply clears the authentication cookie.
        /// </summary>
        /// <returns></returns>
        [HttpPost("logout")]
        public async Task<IActionResult> Logout()
        {
            var user = this.CurrentUser;
            if (user != null)
            {
                await RemoveAuthenticationCookie();
                _log.LogDebug("User {Email} logged out", user.Email);
            }
            return Ok();
        }

    }
}
