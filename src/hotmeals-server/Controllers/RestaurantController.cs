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
    [Route("api/restaurants")]
    [ApiController]
    [Authorize]
    public class RestaurantController : BaseController
    {

        ILogger<RestaurantController> _log;
        private HMContext _db;

        public RestaurantController(ILogger<RestaurantController> logger, HMContext db)
        {
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Returns the list of all restaurants. 
        /// If the current user is a customer then all restaurants which can be ordered from are returned.
        /// If the current user is a restaurant owner then only the restaurants from that user are returned.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetAllRestaurants()
        {
            if (this.CurrentUser.IsRestaurantOwner)
            {
                var result = from r in _db.Restaurants
                             where r.OwnerId == CurrentUser.Id
                             select new RestaurantDTO(r.Id, r.Name, r.Description, r.PhoneNumber);
                return Ok(new GetRestaurantsResponse(await result.ToArrayAsync()));
            }
            else
            {
                var result = from r in _db.Restaurants
                             where !r.BlockedUsers.Any(x => x.UserId == CurrentUser.Id) && r.MenuItems.Any()
                             select new RestaurantDTO(r.Id, r.Name, r.Description, r.PhoneNumber);
                return Ok(new GetRestaurantsResponse(await result.ToArrayAsync()));
            }
        }


        [HttpPost("")]
        public async Task<IActionResult> AddRestaurant([FromBody] NewRestaurantRequest req)
        {
            if (!CurrentUser.IsRestaurantOwner)
                return BadRequest(new APIResponse(false, "You may not create new restaurants!"));


            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == CurrentUser.Id && x.Name.ToLower() == req.Name.ToLower());
            if (restaurant != null)
                return BadRequest(new APIResponse(false, "You already have a restaurant with the same name!"));

            restaurant = new RestaurantRecord();
            restaurant.OwnerId = CurrentUser.Id;
            restaurant.Name = req.Name.Trim();
            restaurant.Description = req.Description.Trim();
            restaurant.PhoneNumber = req.PhoneNumber.Trim();
            _db.Restaurants.Add(restaurant);

            await _db.SaveChangesAsync();
            return Ok(new NewRestaurantResponse(new RestaurantDTO(
                Id: restaurant.Id,
                Name: restaurant.Name,
                Description: restaurant.Description,
                PhoneNumber: restaurant.PhoneNumber)));
        }


        [HttpPut("")]
        public async Task<IActionResult> UpdateRestaurant([FromBody] UpdateRestaurantRequest req)
        {
            if (!CurrentUser.IsRestaurantOwner)
                return BadRequest(new APIResponse(false, "You may not update a restaurant!"));

            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == CurrentUser.Id && x.Id == req.Id);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps deleted it?"));

            if (string.Compare(restaurant.Name, req.Name.Trim(), ignoreCase: true) != 0) {
                // Name changed
                var sameName = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == CurrentUser.Id && x.Name.ToLower() == req.Name.ToLower());
                if (sameName != null)
                    return BadRequest(new APIResponse(false, "You already have a restaurant with the same name!"));
            }

            restaurant.Name = req.Name.Trim();
            restaurant.Description = req.Description.Trim();
            restaurant.PhoneNumber = req.PhoneNumber.Trim();
            await _db.SaveChangesAsync();
            return Ok(new UpdateRestaurantResponse(new RestaurantDTO(
                Id: restaurant.Id,
                Name: restaurant.Name,
                Description: restaurant.Description,
                PhoneNumber: restaurant.PhoneNumber)));
        }


        [HttpDelete("")]
        public async Task<IActionResult> DeleteRestaurant([FromBody] DeleteRestaurantRequest req)
        {
            if (!CurrentUser.IsRestaurantOwner)
                return BadRequest(new APIResponse(false, "You may not delete a restaurant!"));

            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == CurrentUser.Id && x.Id == req.Id);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps already deleted it?"));
            if (restaurant.Orders.Any())
                return BadRequest(new APIResponse(false, "You may not delete a restaurant. There are orders associated with it. Remove all menu items if you would like to prevent customers from ordering."));

            _db.Restaurants.Remove(restaurant);
            await _db.SaveChangesAsync();
            return Ok(new DeleteRestaurantResponse());
        }


    }
}
