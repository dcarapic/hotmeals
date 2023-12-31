﻿using System;
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
    /// Controller for handling commands and queries for blocked usres.
    /// </summary>
    [Route("api/blocked-users")]
    [ApiController]
    [Authorize(Roles = Services.JwtServiceDefaults.RoleOwner)]
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
            var result = from r in _db.BlockedUsers
                         join u in _db.Users on r.UserId equals u.Id
                         where r.RestaurantOwnerId == this.ApplicationUser.Id
                         orderby r.DateCreated
                         select new BlockedUserDTO(u.Email, u.FirstName, u.LastName, u.AddressCityZip, u.AddressCity, u.AddressStreet);
            return Ok(new GetBlockedUsersResponse(await result.ToArrayAsync()));
        }

        /// <summary>
        /// Blocks a user.
        /// </summary>
        [HttpPost("{email}")]
        public async Task<IActionResult> BlockUser(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower());
            // If user does not exist then simply say that its ok
            if (user == null)
                return Ok(new APIResponse(true));

            var block = await _db.BlockedUsers.FirstOrDefaultAsync(x => x.RestaurantOwnerId == ApplicationUser.Id && x.UserId == user.Id);
            // If already blocked its also OK
            if (block != null)
                return Ok(new APIResponse(true));

            block = new BlockedUserRecord();
            block.RestaurantOwnerId = ApplicationUser.Id;
            block.UserId = user.Id;
            block.DateCreated = DateTime.UtcNow;
            _db.BlockedUsers.Add(block);

            await _db.SaveChangesAsync();
            _log.LogInformation($"Owner {ApplicationUser.Email} blocked customer {email}");
            return Ok(new APIResponse(true));
        }

        /// <summary>
        /// Blocks a user.
        /// </summary>
        [HttpDelete("{email}")]
        public async Task<IActionResult> UnBlockUser(string email)
        {
            var user = await _db.Users.FirstOrDefaultAsync(x => x.Email.ToLower() == email.ToLower());
            // If user does not exist then simply say that its ok
            if (user == null)
                return Ok(new APIResponse(true));

            var block = await _db.BlockedUsers.FirstOrDefaultAsync(x => x.RestaurantOwnerId == ApplicationUser.Id && x.UserId == user.Id);
            // If not blocked then its also OK
            if (block == null)
                return Ok(new APIResponse(true));

            _db.BlockedUsers.Remove(block);
            await _db.SaveChangesAsync();
            _log.LogInformation($"Owner {ApplicationUser.Email} unblocked customer {email}");
            return Ok(new APIResponse(true));
        }

    }
}
