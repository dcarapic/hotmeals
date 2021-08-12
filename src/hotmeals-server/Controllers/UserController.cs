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
    /// User and authentication controller.
    /// </summary>
    [Route("api/user")]
    [ApiController]
    [Authorize]
    public class UserController : BaseController
    {

        ILogger<UserController> _log;
        private IConfiguration _config;
        private HMContext _db;

        public UserController(ILogger<UserController> logger, IConfiguration config, HMContext db)
        {
            _log = logger;
            _config = config;
            _db = db;
        }


        /// <summary>
        /// Authenticates the user via provided username and password and provides authentication cookie in the response.
        /// </summary>
        /// <param name="req">Login request data</param>
        /// <returns></returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
            if (user == null || !this.VerifyPassword(
                enteredPassword: req.Password,
                storedHash: user.PasswordHash,
                storedSalt: user.PasswordSalt))
                return this.BadRequest(new APIResponse(false, $"There is no user with such email or password!"));

            var current = new CurrentUserData(user.Id, user.Email, user.IsRestaurantOwner);
            _log.LogDebug("User {Email} logged in", user.Email);
            await AddAuthenticationCookie(current);
            return Ok(new LoginResponse(new UserDTO(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner)));
        }

        /// <summary>
        /// Attempts to authenticate the user based on request cookie.
        /// </summary>
        [HttpGet("authenticate")]
        [AllowAnonymous]
        public async Task<IActionResult> Authenticate()
        {
            if (CurrentUser == null)
                return this.Unauthorized(new APIResponse(false, $"You are not logged in. Please login via /api/users/login and using your email and password!"));

            var user = await _db.Users.FindAsync(CurrentUser.Id);
            if(user == null) {
                await this.RemoveAuthenticationCookie();
                return this.Unauthorized(new APIResponse(false, $"You are not logged in. Please login via /api/users/login and using your email and password!"));
            }

            return Ok(new LoginResponse(new UserDTO(
                         Email: user.Email,
                         FirstName: user.FirstName,
                         LastName: user.LastName,
                         AddressCityZip: user.AddressCityZip,
                         AddressCity: user.AddressCity,
                         AddressStreet: user.AddressStreet,
                         IsRestaurantOwner: user.IsRestaurantOwner)));
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
            return Ok(new APIResponse(true));
        }


        [HttpPost("")]
        [AllowAnonymous]
        public async Task<IActionResult> RegisterUser([FromBody] RegisterUserRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
            if (user != null)
                return this.BadRequest(new APIResponse(false, $"User with email address {req.Email} is already registered!"));

            user = new UserRecord();
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
            var current = new CurrentUserData(user.Id, user.Email, user.IsRestaurantOwner);
            await this.AddAuthenticationCookie(current);

            return Ok(new RegisterUserResponse(new UserDTO(
                         Email: user.Email,
                         FirstName: user.FirstName,
                         LastName: user.LastName,
                         AddressCityZip: user.AddressCityZip,
                         AddressCity: user.AddressCity,
                         AddressStreet: user.AddressStreet,
                         IsRestaurantOwner: user.IsRestaurantOwner)));
        }

        [HttpPut("")]
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

            if (!string.IsNullOrEmpty(req.NewPassword))
            {
                var hs = GenerateSaltedHash(req.NewPassword);
                user.PasswordHash = hs.Hash;
                user.PasswordSalt = hs.Salt;
            }
            await _db.SaveChangesAsync();
            return Ok(new UpdateUserResponse(new UserDTO(
                         Email: user.Email,
                         FirstName: user.FirstName,
                         LastName: user.LastName,
                         AddressCityZip: user.AddressCityZip,
                         AddressCity: user.AddressCity,
                         AddressStreet: user.AddressStreet,
                         IsRestaurantOwner: user.IsRestaurantOwner)));
        }


    }
}
