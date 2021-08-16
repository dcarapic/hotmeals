using System;
using System.Linq;

using Xunit;
using hotmeals_server;
using Microsoft.AspNetCore.TestHost;
using Microsoft.AspNetCore.Hosting;
using System.Net.Http;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using System.Net.Http.Json;
using Microsoft.EntityFrameworkCore;
using hotmeals_server.Model;

namespace hotmeals_server.tests
{
    public class BlockedControllerTests : ControllerTestBase, IDisposable
    {

        [Fact]
        public async Task GetAllBlockedUsers()
        {
            await SeedDb();
            UserRecord owner = null;
            UserRecord blockedCustomer1 = null;
            UserRecord blockedCustomer2 = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);

                blockedCustomer1 = await db.Users.Where(x => !x.IsRestaurantOwner).FirstAsync();
                db.BlockedUsers.Add(new BlockedUserRecord() { RestaurantOwner = owner, User = blockedCustomer1 });
                await db.SaveChangesAsync();

                blockedCustomer2 = await db.Users.Where(x => !x.IsRestaurantOwner).Skip(1).FirstAsync();
                db.BlockedUsers.Add(new BlockedUserRecord() { RestaurantOwner = owner, User = blockedCustomer2 });
                await db.SaveChangesAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/blocked-users", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetBlockedUsersResponse>();
            Assert.Equal(2, result.BlockedUsers.Length);
            Assert.Contains(result.BlockedUsers, (x) => x.Email == blockedCustomer1.Email);
            Assert.Contains(result.BlockedUsers, (x) => x.Email == blockedCustomer2.Email);
        }

        [Fact]
        public async Task BlockUser()
        {
            await SeedDb();
            UserRecord owner = null;
            UserRecord customerToBlock = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                customerToBlock = await db.Users.Where(x => !x.IsRestaurantOwner).FirstAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/blocked-users/{Uri.EscapeDataString(customerToBlock.Email)}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            await WithDb(async db =>
            {
                Assert.Single(db.BlockedUsers);
                var blockedCustomer = await db.BlockedUsers.FirstAsync();
                Assert.Equal(owner.Id, blockedCustomer.RestaurantOwnerId);
                Assert.Equal(customerToBlock.Id, blockedCustomer.UserId);
            });
        }

        [Fact]
        public async Task BlockUser_UnknownEmail()
        {
            await SeedDb();
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/blocked-users/{Uri.EscapeDataString("any@mail.com")}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
        }

        [Fact]
        public async Task UnBlockUser()
        {
            await SeedDb();
            UserRecord owner = null;
            UserRecord blockedCustomer1 = null;
            UserRecord blockedCustomer2 = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);

                blockedCustomer1 = await db.Users.Where(x => !x.IsRestaurantOwner).FirstAsync();
                db.BlockedUsers.Add(new BlockedUserRecord() { RestaurantOwner = owner, User = blockedCustomer1 });
                await db.SaveChangesAsync();

                blockedCustomer2 = await db.Users.Where(x => !x.IsRestaurantOwner).Skip(1).FirstAsync();
                db.BlockedUsers.Add(new BlockedUserRecord() { RestaurantOwner = owner, User = blockedCustomer2 });
                await db.SaveChangesAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/blocked-users/{Uri.EscapeDataString(blockedCustomer2.Email)}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            await WithDb(async db =>
            {
                Assert.Single(db.BlockedUsers);
                var existing = await db.BlockedUsers.FirstAsync();
                Assert.Equal(blockedCustomer1.Id, existing.UserId);
            });
        }


        [Fact]
        public async Task UnBlockUser_UnknownEmail()
        {
            await SeedDb();
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/blocked-users/{Uri.EscapeDataString("any@mail.com")}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
        }




        [Fact]
        public async Task BlockedUsers_InvalidExceptOwner()
        {
            await SeedDb();
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
            });
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/blocked-users", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/blocked-users/{Uri.EscapeDataString("test@test.com")}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/blocked-users/{Uri.EscapeDataString("test@test.com")}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);


        }



    }
}
