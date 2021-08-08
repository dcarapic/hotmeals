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
        // Cached current user (if authenticated)
        private UserData _currentUser;

        /// <summary>
        /// Current user. Can be null if user is not authenticated.
        /// </summary>
        protected UserData CurrentUser
        {
            get
            {
                // Get the base user and check if it is authenticated
                if (!User.Identity.IsAuthenticated)
                    return null;

                // Create actual user from Claims
                if (_currentUser == null)
                {
                    var id = Guid.Parse(User.Claims.First(x=>x.Type == nameof(UserData.Id)).Value);
                    var email = User.Claims.First(x=>x.Type == nameof(UserData.Email)).Value;
                    _currentUser = new UserData(id, email);
                }
                return _currentUser;
            }
        }

    }
}
