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
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO login)
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
            var user = new UserData(Guid.Empty, login.Email);

            // Claims are stored in the authentication cookie so that we do not have to load
            // them from DB again. Cookie is encrypted so its safe that they are there.
            var claims = new Claim[] {
                new Claim(nameof(UserData.Id), user.Id.ToString()),
                new Claim(nameof(UserData.Email), user.Email),
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            // Write cookie to the response
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties
                {
                    IsPersistent = false
                });

            _log.LogDebug("User {Email} logged in", user.Email);
            return Ok(new UserDTO(user.Email, "First", "Last", false));
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
                await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                _log.LogDebug("User {Email} logged out", user.Email);
            }
            return Ok();
        }

    }
}
