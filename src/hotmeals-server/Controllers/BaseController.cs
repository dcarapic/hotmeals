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


namespace hotmeals_server.Controllers
{
    /// <summary>
    /// Base class for controllers.
    /// </summary>
    public abstract class BaseController : ControllerBase
    {
        // Cached current user base data (if authenticated)
        private CurrentUserData _currentUser;

        /// <summary>
        /// Current user base data. Can be null if user is not authenticated.
        /// </summary>
        protected CurrentUserData CurrentUser
        {
            get
            {
                // Get the base user and check if it is authenticated
                if (!User.Identity.IsAuthenticated)
                    return null;

                // Create actual user from Claims
                if (_currentUser == null)
                {
                    var id = Guid.Parse(User.Claims.First(x => x.Type == nameof(CurrentUserData.Id)).Value);
                    var email = User.Claims.First(x => x.Type == nameof(CurrentUserData.Email)).Value;
                    var isOwner = int.Parse(User.Claims.First(x => x.Type == nameof(CurrentUserData.IsRestaurantOwner)).Value) == 1;
                    _currentUser = new CurrentUserData(id, email, isOwner);
                }
                return _currentUser;
            }
        }

        /// <summary>
        /// Adds authentication cookie for the given user.
        /// </summary>
        /// <param name="user"></param>
        /// <returns></returns>
        protected async Task AddAuthenticationCookie(CurrentUserData user)
        {
            var claims = new Claim[] {
                new Claim(ClaimTypes.NameIdentifier, user.Email),
                new Claim(nameof(CurrentUserData.Id), user.Id.ToString()),
                new Claim(nameof(CurrentUserData.Email), user.Email),
                new Claim(nameof(CurrentUserData.IsRestaurantOwner), user.IsRestaurantOwner ? "1" : "0"),
            };
            var identity = new ClaimsIdentity(claims, CookieAuthenticationDefaults.AuthenticationScheme);

            // Write cookie to the response
            // Note: Cookie is encrypted so it is safe to store user id and email.
            await HttpContext.SignInAsync(
                CookieAuthenticationDefaults.AuthenticationScheme,
                new ClaimsPrincipal(identity),
                new AuthenticationProperties
                {
                    IsPersistent = false
                });
        }

        protected async Task RemoveAuthenticationCookie()
        {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }


        protected class HashSalt
        {
            public string Hash { get; set; }
            public string Salt { get; set; }
        }

        protected HashSalt GenerateSaltedHash(string password)
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

        protected bool VerifyPassword(string enteredPassword, string storedHash, string storedSalt)
        {
            var saltBytes = Convert.FromBase64String(storedSalt);
            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(enteredPassword, saltBytes, 10000);
            return Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256)) == storedHash;
        }

    }

    public record CurrentUserData(Guid Id, string Email, bool IsRestaurantOwner) {
        public bool IsCustomer => !IsRestaurantOwner;
    }
}
