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
    public class RestaurantControllerTests : ControllerTestBase, IDisposable
    {

        [Fact]
        public async Task GetAllRestaurants_Owner()
        {
            await SeedDb();
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.Include(x=>x.Restaurants).FirstAsync(x => x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetRestaurantsResponse>();
            Assert.Equal(owner.Restaurants.Count, result.Restaurants.Length);
            Assert.All(result.Restaurants, x => owner.Restaurants.Any(y => x.Id == y.Id));
        }

        [Fact]
        public async Task GetAllRestaurants_Customer()
        {
            await SeedDb(customerCount: 1, ownerCount: 2, restaurantCount:2);
            UserRecord owner = null;
            UserRecord blockingOwner = null;
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                owner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).FirstAsync();

                // Clear menu from first restaurant
                db.MenuItems.RemoveRange(await db.MenuItems.Where(x=>x.RestaurantId == owner.Restaurants.First().Id).ToListAsync());

                blockingOwner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).Skip(1).FirstAsync();

                // Owner is blocking user
                blockingOwner.BlockedUsers.Add(new BlockedUserRecord() { User = customer });
                await db.SaveChangesAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetRestaurantsResponse>();
            // Only one restaurant is returned, the other has no items and the other owner is blocking the customer
            Assert.Single(result.Restaurants);
            Assert.Equal(owner.Restaurants.Last().Id, result.Restaurants[0].Id);
        }


        [Fact]
        public async Task AddRestaurant()
        {
            await SeedDb(addRestaurants:false);
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });

            var req = new NewRestaurantRequest("Restaurant", "Description", "000");
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants", owner);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<NewRestaurantResponse>();
            await WithDb(async db =>
            {
                Assert.Single(db.Restaurants);
                var r = await db.Restaurants.FirstAsync();
                Assert.Equal(owner.Id, r.OwnerId);
                Assert.Equal(r.Name, req.Name);
                Assert.Equal(r.Description, req.Description);
                Assert.Equal(r.PhoneNumber, req.PhoneNumber);
                Assert.Equal(req.Name, result.Restaurant.Name);
                Assert.Equal(req.Description, result.Restaurant.Description);
                Assert.Equal(req.PhoneNumber, result.Restaurant.PhoneNumber);
            });
        }


        [Fact]
        public async Task UpdateRestaurant()
        {
            await SeedDb(addRestaurants: false);
            UserRecord owner = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = new RestaurantRecord() { Name = $"Restaurant", Description = $"Restaurant description", DateCreated = DateTime.UtcNow, PhoneNumber = $"000", Version = 1 };
                owner.Restaurants.Add(r);
                await db.SaveChangesAsync();
            });

            var req = new UpdateRestaurantRequest("Restaurant-updated", "Description-updated", "0002");
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}", owner);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<UpdateRestaurantResponse>();
            await WithDb(async db =>
            {
                var r = await db.Restaurants.FirstAsync();
                Assert.Equal(r.Name, req.Name);
                Assert.Equal(r.Description, req.Description);
                Assert.Equal(r.PhoneNumber, req.PhoneNumber);
                Assert.Equal(req.Name, result.Restaurant.Name);
                Assert.Equal(req.Description, result.Restaurant.Description);
                Assert.Equal(req.PhoneNumber, result.Restaurant.PhoneNumber);
            });
        }



        [Fact]
        public async Task DeleteRestaurant()
        {
            await SeedDb(addRestaurants: false);
            UserRecord owner = null;
            RestaurantRecord r1 = null;
            RestaurantRecord r2 = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r1 = new RestaurantRecord() { Name = $"Restaurant 1", Description = $"Restaurant description 2", DateCreated = DateTime.UtcNow, PhoneNumber = $"0001", Version = 1 };
                r2 = new RestaurantRecord() { Name = $"Restaurant 2", Description = $"Restaurant description 2", DateCreated = DateTime.UtcNow, PhoneNumber = $"0002", Version = 1 };
                owner.Restaurants.Add(r1);
                owner.Restaurants.Add(r2);
                await db.SaveChangesAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r2.Id.ToString())}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            await WithDb(async db =>
            {
                Assert.Single(db.Restaurants);
                Assert.Null(await db.Restaurants.FindAsync(r2.Id));
            });
        }



        [Fact]
        public async Task Restaurants_InvalidExceptOwner()
        {
            await SeedDb();
            UserRecord customer = null;
            UserRecord owner = null;
            UserRecord otherOwner = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                owner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).FirstAsync();
                otherOwner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).Skip(1).FirstAsync();
                r = otherOwner.Restaurants.First();
            });

            // Customer can not add restaurant
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}", owner);
            hrm.Content = JsonContent.Create(new UpdateRestaurantRequest("Restaurant-updated", "Description-updated", "0002"));
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}", owner);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

        }

        [Fact]
        public async Task GetMenuItems_Owner()
        {
            await SeedDb(menuItemCount: 2);
            UserRecord owner = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x=>x.MenuItems).FirstAsync(x => x.OwnerId == owner.Id); 
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetMenuItemsResponse>();
            Assert.Equal(r.MenuItems.Count, result.MenuItems.Length);
            Assert.All(result.MenuItems, x => r.MenuItems.Any(y => x.MenuItemId == y.Id));
        }


        [Fact]
        public async Task GetMenuItems_Customer()
        {
            await SeedDb(menuItemCount: 2);
            UserRecord customer = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetMenuItemsResponse>();
            Assert.Equal(r.MenuItems.Count, result.MenuItems.Length);
            Assert.All(result.MenuItems, x => r.MenuItems.Any(y => x.MenuItemId == y.Id));
        }




        [Fact]
        public async Task AddMenuItem()
        {
            await SeedDb(menuItemCount: 0);
            UserRecord owner = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync(x => x.OwnerId == owner.Id);
            });


            var req = new NewMenuItemRequest("Restaurant", "Description", 100);
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", owner);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<NewMenuItemResponse>();
            await WithDb(async db =>
            {
                Assert.Single(db.MenuItems);
                var mi = await db.MenuItems.FirstAsync();
                Assert.Equal(mi.RestaurantId, result.MenuItem.RestaurantId);
                Assert.Equal(mi.Name, result.MenuItem.Name);
                Assert.Equal(mi.Description, result.MenuItem.Description);
                Assert.Equal(mi.Price, result.MenuItem.Price);
                Assert.Equal(mi.Name, result.MenuItem.Name);
                Assert.Equal(mi.Description, result.MenuItem.Description);
                Assert.Equal(mi.Price, result.MenuItem.Price);
            });
        }


        [Fact]
        public async Task UpdateMenuItem()
        {
            await SeedDb(menuItemCount: 2);
            UserRecord owner = null;
            RestaurantRecord r = null;
            MenuItemRecord mi = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync(x => x.OwnerId == owner.Id);
                mi = r.MenuItems.First();
            });


            var req = new UpdateMenuItemRequest($"{mi.Name}-updated", $"{mi.Description}-updated", mi.Price + 10);
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", owner);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<UpdateMenuItemResponse>();
            await WithDb(async db =>
            {
                mi = await db.MenuItems.FindAsync(mi.Id);
                Assert.Equal(mi.Name, result.MenuItem.Name);
                Assert.Equal(mi.Description, result.MenuItem.Description);
                Assert.Equal(mi.Price, result.MenuItem.Price);
                Assert.Equal(mi.Name, result.MenuItem.Name);
                Assert.Equal(mi.Description, result.MenuItem.Description);
                Assert.Equal(mi.Price, result.MenuItem.Price);
            });
        }

        [Fact]
        public async Task DeleteMenuItem()
        {
            await SeedDb(menuItemCount: 2);
            UserRecord owner = null;
            RestaurantRecord r = null;
            MenuItemRecord mi = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync(x => x.OwnerId == owner.Id);
                mi = r.MenuItems.First();
            });


            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            await WithDb(async db =>
            {
                Assert.Null(await db.MenuItems.FindAsync(mi.Id));
            });
        }


        [Fact]
        public async Task MenuItems_InvalidExceptOwner()
        {
            await SeedDb(menuItemCount: 2);
            UserRecord customer = null;
            UserRecord owner = null;
            UserRecord otherOwner = null;
            RestaurantRecord r = null;
            MenuItemRecord mi = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                owner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).FirstAsync();
                otherOwner = await db.Users.Include(x => x.Restaurants).Where(x => x.IsRestaurantOwner).Skip(1).FirstAsync();
                r = otherOwner.Restaurants.First();
                mi = await db.MenuItems.FirstAsync(x=>x.RestaurantId == r.Id);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu", owner);
            hrm.Content = JsonContent.Create(new NewMenuItemRequest("Restaurant", "Description", 100));
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", owner);
            hrm.Content = JsonContent.Create(new UpdateMenuItemRequest("Restaurant", "Description", 100));
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", customer);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString(r.Id.ToString())}/menu/{Uri.EscapeDataString(mi.Id.ToString())}", owner);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

        }




    }
}
