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
        const int RestaurantsResultPageSize = 20;

        public RestaurantController(ILogger<RestaurantController> logger, HMContext db)
        {
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Returns the list of all restaurants. 
        /// If the current user is a customer then all restaurants which can be ordered from are returned. The results are paged.
        /// If the current user is a restaurant owner then only the restaurants from that user are returned. The results are always in one page.
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetAllRestaurants([FromQuery] int page = 1)
        {
            IQueryable<RestaurantDTO> qry;
            var totalPages = 1;

            if (this.ApplicationUser.IsRestaurantOwner)
            {
                qry = from r in _db.Restaurants
                      where r.OwnerId == ApplicationUser.Id
                      orderby r.DateCreated
                      select new RestaurantDTO(r.Id, r.Name, r.Description, r.PhoneNumber);
            }
            else
            {
                qry = from r in _db.Restaurants
                      join o in _db.Users on r.OwnerId equals o.Id
                      where !o.BlockedUsers.Any(x => x.UserId == ApplicationUser.Id) && r.MenuItems.Any()
                      orderby r.Name
                      select new RestaurantDTO(r.Id, r.Name, r.Description, r.PhoneNumber);

                var total = (int)(await qry.CountAsync());
                totalPages = total == 0 ? 0 : (total / RestaurantsResultPageSize) + 1;
                qry = qry.Skip(page - 1).Take(RestaurantsResultPageSize);
            }

            return Ok(new GetRestaurantsResponse(await qry.ToArrayAsync(), TotalPages: totalPages, Page: 1));
        }

        /// <summary>
        /// Adds a new restaurant for the currently logged on user.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = RoleOwner)]
        public async Task<IActionResult> AddRestaurant([FromBody] NewRestaurantRequest req)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Name.ToLower() == req.Name.ToLower());
            if (restaurant != null)
                return BadRequest(new APIResponse(false, "You already have a restaurant with the same name!"));

            restaurant = new RestaurantRecord();
            restaurant.OwnerId = ApplicationUser.Id;
            restaurant.Name = req.Name.Trim();
            restaurant.Description = req.Description.Trim();
            restaurant.PhoneNumber = req.PhoneNumber.Trim();
            restaurant.DateCreated = DateTime.UtcNow;
            restaurant.Version = 1;
            _db.Restaurants.Add(restaurant);

            await _db.SaveChangesAsync();
            return Ok(new NewRestaurantResponse(new RestaurantDTO(
                Id: restaurant.Id,
                Name: restaurant.Name,
                Description: restaurant.Description,
                PhoneNumber: restaurant.PhoneNumber)));
        }

        /// <summary>
        /// Updates the restaurant of the currently logged on user.
        /// </summary>
        [HttpPut("{restaurantId}")]
        [Authorize(Roles = RoleOwner)]
        public async Task<IActionResult> UpdateRestaurant(Guid restaurantId, [FromBody] UpdateRestaurantRequest req)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps deleted it?"));

            if (string.Compare(restaurant.Name, req.Name.Trim(), ignoreCase: true) != 0)
            {
                // Name changed
                var sameName = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Name.ToLower() == req.Name.ToLower());
                if (sameName != null)
                    return BadRequest(new APIResponse(false, "You already have a restaurant with the same name!"));
            }

            restaurant.Name = req.Name.Trim();
            restaurant.Description = req.Description.Trim();
            restaurant.PhoneNumber = req.PhoneNumber.Trim();
            // TODO: Get version from request and not from the db object
            restaurant.Version += 1;
            await _db.SaveChangesAsync();
            return Ok(new UpdateRestaurantResponse(new RestaurantDTO(
                Id: restaurant.Id,
                Name: restaurant.Name,
                Description: restaurant.Description,
                PhoneNumber: restaurant.PhoneNumber)));
        }

        /// <summary>
        /// Deletes a restaurant owned by currently logged in user.
        /// </summary>
        /// <param name="restaurantId"></param>
        /// <returns></returns>
        [HttpDelete("{restaurantId}")]
        [Authorize(Roles = RoleOwner)]
        public async Task<IActionResult> DeleteRestaurant(Guid restaurantId)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps already deleted it?"));
            if (restaurant.Orders.Any())
                return BadRequest(new APIResponse(false, "You may not delete a restaurant. There are orders associated with it. Remove all menu items if you would like to prevent customers from ordering."));

            _db.Restaurants.Remove(restaurant);
            await _db.SaveChangesAsync();
            return Ok(new APIResponse(true, null));
        }



        /// <summary>
        /// Gets the restaurant menu.
        /// If the current user is a customer then menu items are returned only if the customer is not blocked.
        /// If the current user is a restaurant he can only request menu from his own restaurant.
        /// </summary>
        /// <returns></returns>
        [HttpGet("{restaurantId}/menu")]
        public async Task<IActionResult> GetRestaurantMenu(Guid restaurantId)
        {
            IQueryable<MenuItemDTO> qry;
            RestaurantRecord restaurant;
            if (this.ApplicationUser.IsCustomer)
            {
                restaurant = await (from r in _db.Restaurants
                                    join o in _db.Users on r.OwnerId equals o.Id
                                    where !o.BlockedUsers.Any(x => x.UserId == ApplicationUser.Id) && r.MenuItems.Any()
                                    where r.Id == restaurantId
                                    select r).FirstOrDefaultAsync();
                if (restaurant == null)
                    return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps deleted it?"));
                qry = from mi in _db.MenuItems
                      where mi.RestaurantId == restaurant.Id
                      orderby mi.DateCreated
                      select new MenuItemDTO(mi.Id, mi.RestaurantId, mi.Name, mi.Description, mi.Price);
            }
            else
            {
                restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
                if (restaurant == null)
                    return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps deleted it?"));
                qry = from mi in _db.MenuItems
                      where mi.RestaurantId == restaurant.Id
                      orderby mi.DateCreated
                      select new MenuItemDTO(mi.Id, mi.RestaurantId, mi.Name, mi.Description, mi.Price);
            }
            return Ok(new GetMenuItemsResponse(restaurant.Id, restaurant.Name, restaurant.Description, restaurant.PhoneNumber, await qry.ToArrayAsync()));
        }

        /// <summary>
        /// Adds a new restaurant for the currently logged on user.
        /// </summary>
        [HttpPost("{restaurantId}/menu")]
        [Authorize(Roles = RoleOwner)]
        public async Task<IActionResult> AddMenuItem(Guid restaurantId, [FromBody] NewMenuItemRequest req)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps already deleted it?"));

            var menuItem = await _db.MenuItems.FirstOrDefaultAsync(x => x.RestaurantId == restaurantId && x.Name.ToLower() == req.Name.ToLower());
            if (menuItem != null)
                return BadRequest(new APIResponse(false, "You already have a menu item with the same name!"));

            menuItem = new MenuItemRecord();
            menuItem.RestaurantId = restaurantId;
            menuItem.Name = req.Name.Trim();
            menuItem.Description = req.Description.Trim();
            menuItem.Price = req.Price;
            menuItem.DateCreated = DateTime.UtcNow;
            _db.MenuItems.Add(menuItem);

            await _db.SaveChangesAsync();
            return Ok(new NewMenuItemResponse(new MenuItemDTO(
                MenuItemId: menuItem.Id,
                RestaurantId: restaurantId,
                Name: menuItem.Name,
                Description: menuItem.Description,
                Price: menuItem.Price)));
        }

        /// <summary>
        /// Updates the restaurant of the currently logged on user.
        /// </summary>
        [HttpPut("{restaurantId}/menu/{menuItemId}")]
        [Authorize(Roles = RoleOwner)]
        public async Task<IActionResult> UpdateMenuItem(Guid menuItemId, Guid restaurantId, [FromBody] UpdateMenuItemRequest req)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps already deleted it?"));

            var menuItem = await _db.MenuItems.FindAsync(menuItemId);
            if (menuItem == null || menuItem.RestaurantId != restaurantId)
                return BadRequest(new APIResponse(false, "The menu item does not exist. Have you perhaps already deleted it?"));

            if (string.Compare(menuItem.Name, req.Name.Trim(), ignoreCase: true) != 0)
            {
                // Name changed
                var sameName = await _db.MenuItems.FirstOrDefaultAsync(x => x.RestaurantId == restaurantId && x.Name.ToLower() == req.Name.ToLower());
                if (sameName != null)
                    return BadRequest(new APIResponse(false, "You already have a menu item with the same name!"));
            }

            menuItem.Name = req.Name.Trim();
            menuItem.Description = req.Description.Trim();
            menuItem.Price = req.Price;
            await _db.SaveChangesAsync();
            return Ok(new UpdateMenuItemResponse(new MenuItemDTO(
                MenuItemId: menuItem.Id,
                RestaurantId: restaurantId,
                Name: menuItem.Name,
                Description: menuItem.Description,
                Price: menuItem.Price)));
        }

        /// <summary>
        /// Deletes a restaurant owned by currently logged in user.
        /// </summary>
        /// <param name="restaurantId"></param>
        /// <returns></returns>
        [HttpDelete("{restaurantId}/menu/{menuItemId}")]
        [Authorize(Roles = RoleOwner)]        
        public async Task<IActionResult> DeleteMenuItem(Guid menuItemId, Guid restaurantId)
        {
            var restaurant = await _db.Restaurants.FirstOrDefaultAsync(x => x.OwnerId == ApplicationUser.Id && x.Id == restaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist. Have you perhaps already deleted it?"));

            var menuItem = await _db.MenuItems.FindAsync(menuItemId);
            if (menuItem == null || menuItem.RestaurantId != restaurantId)
                return BadRequest(new APIResponse(false, "The menu item does not exist. Have you perhaps already deleted it?"));

            _db.MenuItems.Remove(menuItem);
            await _db.SaveChangesAsync();
            return Ok(new APIResponse(true, null));
        }


    }
}
