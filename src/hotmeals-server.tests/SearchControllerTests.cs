using System;
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
    public class SearchControllerTests : ControllerTestBase, IDisposable
    {

        [Fact]
        public async Task Search_OK()
        {
            await SeedDb();
            var uniqueNamePart = "jdhuwekq@#mdihe@#43";
            UserRecord customer = null;
            MenuItemRecord menuItem = new MenuItemRecord() { Name = $"UniqueFood {uniqueNamePart} UniqueFood", Description = " ", Price = 10 };
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                var r = await db.Restaurants.FirstAsync();
                r.MenuItems.Add(menuItem);
                await db.SaveChangesAsync();
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/search/{Uri.EscapeDataString(uniqueNamePart)}", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<SearchFoodResponse>();
            Assert.Single(result.Items);
            Assert.Equal(menuItem.Id, result.Items[0].MenuItemId);
            Assert.Equal(menuItem.Name, result.Items[0].Name);
            Assert.Equal(menuItem.Description, result.Items[0].Description);
            Assert.Equal(menuItem.Price, result.Items[0].Price);
            Assert.Equal(menuItem.RestaurantId, result.Items[0].RestaurantId);
        }


        [Fact]
        public async Task Search_NotFound()
        {
            await SeedDb();
            var uniqueNamePart = "jdhuwekq@#mdihe@#43";
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
            });
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/search/{Uri.EscapeDataString(uniqueNamePart)}", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<SearchFoodResponse>();
            Assert.Empty(result.Items);
        }


        [Fact]
        public async Task Search_UnauthorizedExceptCustomer()
        {
            await SeedDb();
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/search/doesnotmatter", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);

            hrm = new HttpRequestMessage(HttpMethod.Get, $"/api/search/doesnotmatter");
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, res.StatusCode);
        }



    }
}
