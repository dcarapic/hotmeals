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
        public async Task GetAllRestaurants()
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
                Assert.Equal(owner.Id, r.OwnerId);
                Assert.Equal(req.Name, result.Restaurant.Name);
                Assert.Equal(req.Description, result.Restaurant.Description);
                Assert.Equal(req.PhoneNumber, result.Restaurant.PhoneNumber);
            });
        }



        [Fact]
        public async Task Restaurants_UnathorizedExceptOwner()
        {
            //await SeedDb();
            //UserRecord customer = null;
            //await WithDb(async db =>
            //{
            //    customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
            //});
            //var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/restaurants", customer);
            //var res = await Client.SendAsync(hrm);
            //Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            //hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/restaurants/{Uri.EscapeDataString("test@test.com")}", customer);
            //res = await Client.SendAsync(hrm);
            //Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            //hrm = this.CreateAuthenticatedRequest(HttpMethod.Delete, $"/api/restaurants/{Uri.EscapeDataString("test@test.com")}", customer);
            //res = await Client.SendAsync(hrm);
            //Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);


        }



    }
}
