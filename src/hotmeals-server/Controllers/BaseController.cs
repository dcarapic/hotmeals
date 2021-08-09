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
                    _currentUser = new CurrentUserData(id, email);
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
                new Claim(nameof(CurrentUserData.Id), user.Id.ToString()),
                new Claim(nameof(CurrentUserData.Email), user.Email),
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

        protected async Task RemoveAuthenticationCookie() {
            await HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
        }

    }

    public record CurrentUserData(Guid Id, string Email);
}
