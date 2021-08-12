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
    [Route("api/blocked-users")]
    [ApiController]
    [Authorize]
    public class BlockedUsersController : BaseController
    {

        ILogger<BlockedUsersController> _log;
        private HMContext _db;

        public BlockedUsersController(ILogger<BlockedUsersController> logger, HMContext db)
        {
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Returns the list of all blocked users. 
        /// </summary>
        /// <returns></returns>
        [HttpGet]
        public async Task<IActionResult> GetAllBlockedUser()
        {
            if (!this.CurrentUser.IsRestaurantOwner)
                return Unauthorized("You are not a restaurant owner!");

            var result = from r in _db.BlockedUsers
                         join u in _db.Users on r.UserId equals u.Id
                         where r.RestaurantOwnerId == this.CurrentUser.Id
                         orderby r.DateCreated
                         select new BlockedUserDTO(u.Email, u.FirstName, u.LastName, u.AddressCityZip, u.AddressCity, u.AddressStreet);
            return Ok(new GetBlockedUsersResponse(await result.ToArrayAsync()));

        }

        /// <summary>
        /// Blocks a user.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> BlockUser([FromBody] BlockUserRequest req)
        {
            if (!this.CurrentUser.IsRestaurantOwner)
                return Unauthorized("You are not a restaurant owner!");

            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == req.Email.ToLower());
            // If user does not exist then simply say that its ok
            if (user == null)
                return Ok(new APIResponse(true));

            var block = await _db.BlockedUsers.FirstOrDefaultAsync(x => x.RestaurantOwnerId == CurrentUser.Id && x.UserId == user.Id);
            // If already blocked its also OK
            if (block != null)
                return Ok(new APIResponse(true));

            block = new BlockedUserRecord();
            block.RestaurantOwnerId = CurrentUser.Id;
            block.UserId = user.Id;
            block.DateCreated = DateTime.UtcNow;
            _db.BlockedUsers.Add(block);

            await _db.SaveChangesAsync();
            return Ok(new APIResponse(true));
        }

        /// <summary>
        /// Blocks a user.
        /// </summary>
        [HttpDelete]
        public async Task<IActionResult> UnBlockUser([FromBody] UnBlockUserRequest req)
        {
            if (!this.CurrentUser.IsRestaurantOwner)
                return Unauthorized("You are not a restaurant owner!");

            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == req.Email.ToLower());
            // If user does not exist then simply say that its ok
            if (user == null)
                return Ok(new APIResponse(true));

            var block = await _db.BlockedUsers.FirstOrDefaultAsync(x => x.RestaurantOwnerId == CurrentUser.Id && x.UserId == user.Id);
            // If not blocked then its also OK
            if (block == null)
                return Ok(new APIResponse(true));

            _db.BlockedUsers.Remove(block);
            await _db.SaveChangesAsync();
            return Ok(new APIResponse(true));
        }

    }
}
