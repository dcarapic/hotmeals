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
    /// Controller for handling restaurant related commands and queries.
    /// </summary>
    [Route("api/search")]
    [ApiController]
    [Authorize(Roles = RoleCustomer)]
    public class SearchController : BaseController
    {

        ILogger<SearchController> _log;
        private HMContext _db;
        const int SearchResultPageSize = 20;

        public SearchController(ILogger<SearchController> logger, HMContext db)
        {
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Returns the list of all blocked users. 
        /// </summary>
        /// <returns></returns>
        [HttpGet("{searchExpression}")]
        public async Task<IActionResult> Search(string searchExpression, [FromQuery] int page = 1)
        {
            if (this.ApplicationUser.IsRestaurantOwner)
                return Unauthorized("You are not a customer!");

            var qry = (from mi in _db.MenuItems
                       join r in _db.Restaurants on mi.RestaurantId equals r.Id
                       join o in _db.Users on r.OwnerId equals o.Id
                       where !o.BlockedUsers.Any(x => x.UserId == ApplicationUser.Id) // prevent listing from blocked owners
                       where mi.Name.ToLower().Contains(searchExpression.ToLower())
                       select new SearchResultItemDTO(mi.Id, mi.RestaurantId, r.Name, mi.Name, mi.Description, mi.Price));

            //select new OrderSelectionMenuItemDTO(mi.Id, mi.RestaurantId, r.Name, mi.Name, mi.Description, mi.Price));
            var total = (int)(await qry.CountAsync());
            var totalPages = total == 0 ? 0 : (total / SearchResultPageSize) + 1;
            var resultPage = qry.Skip(page - 1).Take(SearchResultPageSize);
            return Ok(new SearchFoodResponse(await resultPage.ToArrayAsync(), totalPages, page));
        }

    }
}
