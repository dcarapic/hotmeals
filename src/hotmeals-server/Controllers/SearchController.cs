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
using System.ComponentModel.DataAnnotations;

namespace hotmeals_server.Controllers
{
    /// <summary>
    /// Controller for handling restaurant related commands and queries.
    /// </summary>
    [Route("api/search")]
    [ApiController]
    [Authorize(Roles = Services.JwtServiceDefaults.RoleCustomer)]
    public class SearchController : BaseController
    {
        const int SearchResultPageSize = 20;

        private readonly ILogger<SearchController> _log;
        private readonly HMContext _db;

        public SearchController(ILogger<SearchController> logger, HMContext db)
        {
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Searches for food.
        /// </summary>
        /// <returns></returns>
        [HttpGet("{searchExpression}")]
        public async Task<IActionResult> Search([MaxLength(100)]string searchExpression, [FromQuery][Range(1, 999999)] int page = 1)
        {
            var qry = (from mi in _db.MenuItems
                       join r in _db.Restaurants on mi.RestaurantId equals r.Id
                       join o in _db.Users on r.OwnerId equals o.Id
                       where !o.BlockedUsers.Any(x => x.UserId == ApplicationUser.Id) // prevent listing from blocked owners
                       where mi.Name.ToLower().Contains(searchExpression.ToLower())
                       select new SearchResultItemDTO(mi.Id, mi.RestaurantId, r.Name, mi.Name, mi.Description, mi.Price));

            //select new OrderSelectionMenuItemDTO(mi.Id, mi.RestaurantId, r.Name, mi.Name, mi.Description, mi.Price));
            var total = (int)(await qry.CountAsync());
            var totalPages = total == 0 ? 0 : (total / SearchResultPageSize) + 1;
            var resultPage = qry.Skip((page - 1) * SearchResultPageSize).Take(SearchResultPageSize);
            return Ok(new SearchFoodResponse(await resultPage.ToArrayAsync(), totalPages, Math.Min(page, totalPages)));
        }

    }
}
