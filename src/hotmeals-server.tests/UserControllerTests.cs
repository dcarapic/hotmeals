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
    public class UserControllerTests : ControllerTestBase
    {

        [Fact]
        public async Task Register_OK()
        {
            var req = new Model.RegisterUserRequest("test@email.com", "First", "Last", "ZIP", "City", "Street", "pwd", true);
            var res = await Client.PostAsJsonAsync("/api/user", req);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<Model.RegisterUserResponse>();
            await WithDb(async (db) =>
            {
                Assert.Equal(1, await db.Users.CountAsync());
                var user = await db.Users.FirstAsync();
                Assert.Equal(req.Email, user.Email);
                Assert.Equal(req.FirstName, user.FirstName);
                Assert.Equal(req.LastName, user.LastName);
                Assert.Equal(req.AddressCityZip , user.AddressCityZip);
                Assert.Equal(req.AddressCity, user.AddressCity);
                Assert.Equal(req.AddressStreet, user.AddressStreet);
                Assert.False(string.IsNullOrEmpty(result.JwtToken));
                Assert.Equal(7 * 24 * 60 * 60, result.ExpiresInSeconds);
            });
        }

        [Fact]
        public async Task Register_InvalidRequest()
        {
            var registration = new Model.RegisterUserRequest("", "", "", "", "", "", "", true);
            var response = await Client.PostAsJsonAsync("/api/user", registration);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, response.StatusCode);
        }

        [Fact]
        public async Task Register_DuplicateEmail()
        {
            var req1 = new Model.RegisterUserRequest("test@email.com", "First", "Last", "ZIP", "City", "Street", "pwd", true);
            var res1 = await Client.PostAsJsonAsync("/api/user", req1);
            Assert.Equal(System.Net.HttpStatusCode.OK, res1.StatusCode);
            var req2 = new Model.RegisterUserRequest("test@email.com", "First", "Last", "ZIP", "City", "Street", "pwd", true);
            var res2 = await Client.PostAsJsonAsync("/api/user", req2);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res2.StatusCode);
        }

        [Fact]
        public async Task Login_InvalidLoginPwd()
        {
            var req = new Model.LoginRequest("test@email.com", "pwd");
            var res = await Client.PostAsJsonAsync("/api/user/login", req);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);
        }

        [Fact]
        public async Task Login_OK()
        {
            var req1 = new Model.RegisterUserRequest("test@email.com", "First", "Last", "ZIP", "City", "Street", "pwd", true);
            var res1 = await Client.PostAsJsonAsync("/api/user", req1);
            Assert.Equal(System.Net.HttpStatusCode.OK, res1.StatusCode);

            var req = new Model.LoginRequest("test@email.com", "pwd");
            var res = await Client.PostAsJsonAsync("/api/user/login", req);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<Model.LoginResponse>();
            await WithDb(async (db) =>
            {
                Assert.Single(db.Users);
                var user = await db.Users.FirstAsync();
                Assert.Equal(req1.Email, user.Email);
                Assert.Equal(req1.FirstName, user.FirstName);
                Assert.Equal(req1.LastName, user.LastName);
                Assert.Equal(req1.AddressCityZip, user.AddressCityZip);
                Assert.Equal(req1.AddressCity, user.AddressCity);
                Assert.Equal(req1.AddressStreet, user.AddressStreet);
                Assert.False(string.IsNullOrEmpty(result.JwtToken));
                Assert.Equal(7 * 24 * 60 * 60, result.ExpiresInSeconds);
            });
        }

        [Fact]
        public async Task Authenticate_OK()
        {
            var req1 = new Model.RegisterUserRequest("test@email.com", "First", "Last", "ZIP", "City", "Street", "pwd", true);
            var res1 = await Client.PostAsJsonAsync("/api/user", req1);
            Assert.Equal(System.Net.HttpStatusCode.OK, res1.StatusCode);
            var result1 = await res1.Content.ReadFromJsonAsync<Model.RegisterUserResponse>();
            var token = result1.JwtToken;

            var hrm = new HttpRequestMessage(HttpMethod.Get, "/api/user/authenticate");
            hrm.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", token);
            var res2 = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res2.StatusCode);
            var result2 = await res2.Content.ReadFromJsonAsync<Model.AuthenticateResponse>();
            await WithDb(async (db) =>
            {
                Assert.Equal(1, await db.Users.CountAsync());
                var user = await db.Users.FirstAsync();
                Assert.Equal(req1.Email, user.Email);
                Assert.Equal(req1.FirstName, user.FirstName);
                Assert.Equal(req1.LastName, user.LastName);
                Assert.Equal(req1.AddressCityZip, user.AddressCityZip);
                Assert.Equal(req1.AddressCity, user.AddressCity);
                Assert.Equal(req1.AddressStreet, user.AddressStreet);
            });
        }

        [Fact]
        public async Task Authenticate_Unathorized()
        {
            var response = await Client.GetAsync("/api/user/authenticate");
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, response.StatusCode);
        }


        [Fact]
        public async Task UpdateUser_OK()
        {
            await SeedDb();
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
            });
            var req = new UpdateUserRequest("First", "Last", "ZIP", "City", "Street", "pwd");
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/user", customer);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<Model.UpdateUserResponse>();
            await WithDb(async (db) =>
            {
                var user = await db.Users.FindAsync(customer.Id);
                Assert.Equal(req.FirstName, user.FirstName);
                Assert.Equal(req.LastName, user.LastName);
                Assert.Equal(req.AddressCityZip, user.AddressCityZip);
                Assert.Equal(req.AddressCity, user.AddressCity);
                Assert.Equal(req.AddressStreet, user.AddressStreet);
            });
        }


        [Fact]
        public async Task UpdateUser_Unauthorized()
        {
            await SeedDb();
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
            });
            var req = new UpdateUserRequest("First", "Last", "ZIP", "City", "Street", "pwd");
            var hrm = new HttpRequestMessage(HttpMethod.Put, $"/api/user");
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Unauthorized, res.StatusCode);
        }



    }
}
