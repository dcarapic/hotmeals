using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using hotmeals_server.Model;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using System.Security.Cryptography;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.IdentityModel.Tokens;

namespace hotmeals_server.Controllers
{
    /// <summary>
    /// Base class for controllers. Provides basic user information, JWT token and password generation.
    /// </summary>
    public abstract class BaseController : ControllerBase
    {

        /// <summary>
        /// Authorization role for customer.
        /// </summary>
        public const string RoleCustomer = "Customer";
        /// <summary>
        /// Authorization role for owner.
        /// </summary>
        public const string RoleOwner = "Owner";

        /// <summary>
        /// Number of seconds for how long the JWT token is valid (after which it expires)
        /// </summary>
        public const int JwtTokenExpirationSeconds = 24 *60 * 60;

        /// <summary>
        /// Contains basic application user data.
        /// </summary>
        /// <param name="Id">User ID</param>
        /// <param name="Email">User email</param>
        /// <param name="IsRestaurantOwner">If true then the user is a restaurant owner</param>
        /// <returns></returns>
        protected record ApplicationUserData(Guid Id, string Email, bool IsRestaurantOwner)
        {
            public bool IsCustomer => !IsRestaurantOwner;
        }

        // Cached current user base data (if authenticated)
        private ApplicationUserData _currentUser;

        /// <summary>
        /// Current application user. Null if the user is not authenticated.
        /// </summary>
        protected ApplicationUserData ApplicationUser
        {
            get
            {
                // Get the base user and check if it is authenticated
                if (!User.Identity.IsAuthenticated)
                    return null;

                // Create actual user from Claims
                if (_currentUser == null)
                {
                    var id = Guid.Parse(User.Claims.First(x => x.Type == nameof(ApplicationUserData.Id)).Value);
                    var email = User.Claims.First(x => x.Type == nameof(ApplicationUserData.Email)).Value;
                    var isOwner = User.IsInRole(RoleOwner);
                    _currentUser = new ApplicationUserData(id, email, isOwner);
                }
                return _currentUser;
            }
        }


        /// <summary>
        /// Contains generated JWT token information
        /// </summary>
        /// <param name="Token">Token</param>
        /// <param name="ExpiresInSeconds">Number of seconds after which the token expires (starting from CreatedAt)</param>
        /// <returns></returns>
        protected record JwtTokenInfo(JwtSecurityToken Token, DateTimeOffset CreatedAt, int ExpiresInSeconds);


        /// <summary>
        /// Generate JWT token.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        protected JwtTokenInfo GenerateToken(ApplicationUserData user, Microsoft.Extensions.Configuration.IConfiguration configuration)
        {
            var claims = new Claim[] {
                new Claim(ClaimTypes.NameIdentifier, user.Email),
                new Claim(nameof(ApplicationUserData.Id), user.Id.ToString()),
                new Claim(nameof(ApplicationUserData.Email), user.Email),
                new Claim(ClaimTypes.Role, user.IsRestaurantOwner ? RoleOwner : RoleCustomer),
                new Claim(JwtRegisteredClaimNames.Sub,user.Email),
                new Claim(JwtRegisteredClaimNames.Jti,Guid.NewGuid().ToString()) // guarantees uniqueness
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(configuration["Jwt:Key"]));
            var now = DateTimeOffset.UtcNow;
            var expiresAt = now.AddSeconds(JwtTokenExpirationSeconds);

            var token = new JwtSecurityToken(
                issuer: configuration["Jwt:Issuer"],
                audience: configuration["Jwt:Audience"],
                expires: expiresAt.UtcDateTime,
                claims: claims,
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );
            return new JwtTokenInfo(Token: token, CreatedAt: now, ExpiresInSeconds: JwtTokenExpirationSeconds);
        }

        /// <summary>
        /// Contains cryptographically secure hash and salt.
        /// </summary>
        /// <param name="Hash">Base64 encoded hash value.</param>
        /// <param name="Salt">Base64 encoded salt value.</param>
        protected record HashSalt(string Hash, string Salt);

        /// <summary>
        /// Generate hash and salt from the given password string.
        /// </summary>
        protected HashSalt GenerateSaltedHash(string password)
        {
            // 128 bit salt
            var saltBytes = new byte[128 / 8];
            var provider = new RNGCryptoServiceProvider();
            provider.GetNonZeroBytes(saltBytes);
            var salt = Convert.ToBase64String(saltBytes);

            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 10000);
            var hashPassword = Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256));

            return new HashSalt(Hash: hashPassword, Salt: salt);
        }

        /// <summary>
        /// Verifies that the provided password matches given hash and salt values
        /// </summary>
        /// <param name="enteredPassword">Password to check.</param>
        /// <param name="storedHash">Base64 encoded hash value.</param>
        /// <param name="storedSalt">Base64 encoded salt value.</param>
        /// <returns></returns>
        protected bool VerifyPassword(string enteredPassword, string storedHash, string storedSalt)
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(enteredPassword, saltBytes, 10000);
            return Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256)) == storedHash;
        }

    }

}
