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
using hotmeals_server.Services;

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

        private readonly ILogger<UserController> _log;
        private readonly HMContext _db;
        private readonly ICryptoService _crypto;
        private readonly IJwtService _jwt;

        public UserController(ILogger<UserController> logger, HMContext db, ICryptoService crypto, IJwtService jwt)
        {
            _log = logger;
            _db = db;
            _crypto = crypto;
            _jwt = jwt;
        }


        /// <summary>
        /// Authenticates the user via provided username and password and provides response with Jwt cookie.
        /// </summary>
        /// <param name="req">Login request data</param>
        /// <returns></returns>
        [HttpPost("login")]
        [AllowAnonymous]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email == req.Email);
            if (user == null || !_crypto.VerifyPassword(
                password: req.Password,
                hash: user.PasswordHash,
                salt: user.PasswordSalt))
                return this.BadRequest(new APIResponse(false, $"There is no user with such email or password!"));

            _log.LogDebug("User {Email} logged in", user.Email);
            var token = _jwt.GenerateToken(user);
            var tokenText = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token.Token);
            return Ok(new LoginResponse(new UserDTO(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner), JwtToken: tokenText, ExpiresInSeconds: token.ExpiresInSeconds));
        }

        /// <summary>
        /// Attempts to authenticate the user based on Jwt bearer.
        /// </summary>
        [HttpGet("authenticate")]
        public async Task<IActionResult> Authenticate()
        {
            var user = await _db.Users.FindAsync(ApplicationUser.Id);
            if (user == null)
                return this.Unauthorized(new APIResponse(false, $"There is no user with provided credentials"));

            return Ok(new AuthenticateResponse(new UserDTO(
                Email: user.Email,
                FirstName: user.FirstName,
                LastName: user.LastName,
                AddressCityZip: user.AddressCityZip,
                AddressCity: user.AddressCity,
                AddressStreet: user.AddressStreet,
                IsRestaurantOwner: user.IsRestaurantOwner)));
        }


        /// <summary>
        /// Does nothing at the moment. 
        /// TODO: Remove refresh cookie.
        /// </summary>
        /// <returns></returns>
        [HttpPost("logout")]
        public IActionResult Logout()
        {
            return Ok(new APIResponse(true));
        }


        [HttpPost]
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

            var hs = _crypto.GenerateSaltedHash(req.Password);
            user.PasswordHash = hs.Hash;
            user.PasswordSalt = hs.Salt;

            _db.Users.Add(user);
            await _db.SaveChangesAsync();

            _log.LogDebug("User {Email} registered in", user.Email);
            var token = _jwt.GenerateToken(user);
            var tokenText = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(token.Token);

            return Ok(new RegisterUserResponse(new UserDTO(
                         Email: user.Email,
                         FirstName: user.FirstName,
                         LastName: user.LastName,
                         AddressCityZip: user.AddressCityZip,
                         AddressCity: user.AddressCity,
                         AddressStreet: user.AddressStreet,
                         IsRestaurantOwner: user.IsRestaurantOwner), JwtToken: tokenText, ExpiresInSeconds: token.ExpiresInSeconds));
        }

        [HttpPut]
        public async Task<IActionResult> UpdateUser([FromBody] UpdateUserRequest req)
        {
            var user = await _db.Users.FindAsync(new object[] { ApplicationUser.Id });
            if (user == null)
                return this.BadRequest(new APIResponse(false, $"There is no user with provided credentials"));

            user.FirstName = req.FirstName;
            user.LastName = req.LastName;
            user.AddressCity = req.AddressCity;
            user.AddressCityZip = req.AddressCityZip;
            user.AddressStreet = req.AddressStreet;

            if (!string.IsNullOrEmpty(req.NewPassword))
            {
                var hs = _crypto.GenerateSaltedHash(req.NewPassword);
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
