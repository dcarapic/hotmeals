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
                    var isOwner = User.IsInRole(Services.JwtServiceDefaults.RoleOwner);
                    _currentUser = new ApplicationUserData(id, email, isOwner);
                }
                return _currentUser;
            }
        }

    }

}
