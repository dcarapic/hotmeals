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
using System.Linq;
using Microsoft.EntityFrameworkCore;

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
        private HMContext _db;

        public UserController(ILogger<AuthController> logger, IConfiguration config, HMContext db)
        {
            _log = logger;
            _config = config;
            _db = db;
        }

        /// <summary>
        /// Authenticates the user and provides authentication cookie in the response.
        /// </summary>
        /// <param name="login">Login request data</param>
        /// <returns></returns>
        [HttpGet("current")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var user = await _db.Users.FindAsync(new object[] { CurrentUser.Id });
            if (user == null)
                return BadRequest("User is no longer available!");

            return Ok(new UserResponse(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner));
        }

        [HttpPost("register")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterUserRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
            if (user != null)
                return this.BadRequest($"User with email address {req.Email} is already registered!");

            user = new User();
            user.Email = req.Email;
            user.FirstName = req.FirstName;
            user.LastName = req.LastName;
            user.AddressCity = req.AddressCity;
            user.AddressCityZip = req.AddressCityZip;
            user.AddressStreet = req.AddressStreet;
            user.IsRestaurantOwner = req.IsRestaurantOwner;

            var hs = GenerateSaltedHash(req.Password);
            user.PasswordHash = hs.Hash;
            user.PasswordSalt = hs.Salt;

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            var current = new CurrentUserData(user.Id, user.Email);
            await this.AddAuthenticationCookie(current);
            return Ok(new UserResponse(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner));
        }

        [HttpPost("")]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest req)
        {

            var user = await _db.Users.FindAsync(new object[] { CurrentUser.Id });
            if (user == null)
                return BadRequest("User is no longer available!");
            user.FirstName = req.FirstName;
            user.LastName = req.LastName;
            user.AddressCity = req.AddressCity;
            user.AddressCityZip = req.AddressCityZip;
            user.AddressStreet = req.AddressStreet;

            if (req.NewPassword != null)
            {
                var hs = GenerateSaltedHash(req.NewPassword);
                user.PasswordHash = hs.Hash;
                user.PasswordSalt = hs.Salt;
            }
            await _db.SaveChangesAsync();
            return Ok(new UserResponse(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner));
        }


    }
}
