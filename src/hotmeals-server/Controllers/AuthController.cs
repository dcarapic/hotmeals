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
using Microsoft.EntityFrameworkCore;

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
        private HMContext _db;

        public AuthController(ILogger<AuthController> logger, IConfiguration config, HMContext db)
        {
            _log = logger;
            _config = config;
            _db = db;
        }

        /// <summary>
        /// Authenticates the user and provides authentication cookie in the response.
        /// </summary>
        /// <param name="req">Login request data</param>
        /// <returns></returns>
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
            if (user == null || !this.VerifyPassword(
                enteredPassword: req.Password,
                storedHash: user.PasswordHash,
                storedSalt: user.PasswordSalt))
                return this.Unauthorized($"There is no user with such email or password!");

            var current = new CurrentUserData(user.Id, user.Email);
            _log.LogDebug("User {Email} logged in", user.Email);
            await AddAuthenticationCookie(current);
            return Ok(new UserResponse(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner));
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
