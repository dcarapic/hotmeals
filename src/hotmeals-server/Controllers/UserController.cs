using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using System.Security.Cryptography;

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
        public UserResponse GetCurrentUser()
        {
            return new UserResponse(
                Email: this.CurrentUser.Email,
                FirstName: "Test",
                LastName: "Name",
                AddressCityZip: "10000",
                AddressCity: "City",
                AddressStreet: "Street",
                IsRestaurantOwner: false);
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterUserRequest req)
        {
            var hs = GenerateSaltedHash(req.Password);
            var user = new CurrentUserData(Guid.Empty, req.Email);
            await this.AddAuthenticationCookie(user);
            return Ok(new UserResponse(
                Email: req.Email,
                FirstName: req.FirstName,
                LastName: req.LastName,
                AddressCityZip: req.AddressCityZip,
                AddressCity: req.AddressCity,
                AddressStreet: req.AddressStreet,
                IsRestaurantOwner: req.IsRestaurantOwner));
        }

        [HttpPost("")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest req)
        {
            if (req.NewPassword != null)
            {
                var hs = GenerateSaltedHash(req.NewPassword);

            }
            return Ok(new UserResponse(
                Email: this.CurrentUser.Email,
                FirstName: req.FirstName,
                LastName: req.LastName,
                AddressCityZip: req.AddressCityZip,
                AddressCity: req.AddressCity,
                AddressStreet: req.AddressStreet,
                IsRestaurantOwner: false));
        }

        private class HashSalt
        {
            public string Hash { get; set; }
            public string Salt { get; set; }
        }

        private static HashSalt GenerateSaltedHash(string password)
        {
            // 128 bit salt
            var saltBytes = new byte[128 / 8];
            var provider = new RNGCryptoServiceProvider();
            provider.GetNonZeroBytes(saltBytes);
            var salt = Convert.ToBase64String(saltBytes);

            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 10000);
            var hashPassword = Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256));

            HashSalt hashSalt = new HashSalt { Hash = hashPassword, Salt = salt };
            return hashSalt;
        }

        private static bool VerifyPassword(string enteredPassword, string storedHash, string storedSalt)
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(enteredPassword, saltBytes, 10000);
            return Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256)) == storedHash;
        }

    }
}
