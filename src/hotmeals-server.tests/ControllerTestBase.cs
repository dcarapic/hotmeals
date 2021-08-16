using hotmeals_server.Model;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Threading.Tasks;

namespace hotmeals_server.tests
{
    public class ControllerTestBase
    {

        private readonly TestWebApplicationFactory<Startup> _server;
        private readonly HttpClient _client;


        public TestWebApplicationFactory<Startup> Server => _server;

        public HttpClient Client => _client;


        public ControllerTestBase()
        {
            // Ensure unique database per test class
            _server = new TestWebApplicationFactory<Startup>(this.GetType().Name);
            _client = _server.CreateClient();
        }



        public async Task WithService<T>(Func<T, Task> method)
        {
            using (var scope = _server.Services.CreateScope())
            {
                var service = scope.ServiceProvider.GetRequiredService<T>();
                await method(service);
            }
        }


        public void WithService<T>(Action<T> method)
        {
            using (var scope = _server.Services.CreateScope())
            {
                var service = scope.ServiceProvider.GetRequiredService<T>();
                method(service);
            }
        }


        public async Task WithDb(Func<HMContext, Task> method)
        {
            await WithService<HMContext>(method);
        }

        public void WithDb(Action<HMContext> method)
        {
            WithService<HMContext>(method);
        }


        public HttpRequestMessage CreateAuthenticatedRequest(HttpMethod method, string uri, Model.UserRecord user)
        {
            var req = new HttpRequestMessage(method, uri);
            WithService<Services.IJwtService>(jwt =>
            {
                var token = jwt.GenerateToken(user);
                req.Headers.Authorization = new System.Net.Http.Headers.AuthenticationHeaderValue("Bearer", jwt.SerializeToken(token));
            });
            return req;
        }

        public async Task ClearDb()
        {
            using (var scope = _server.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<HMContext>();
                if (!await db.Database.EnsureDeletedAsync())
                    throw new InvalidOperationException("Could not drop database!");
                if (!db.Database.EnsureCreated())
                    throw new InvalidOperationException("Could not ensure database!");
            }
        }

        public string DefaultUserPassword => "pwd";

        public async Task SeedDb(bool addUsers = true, bool addRestaurants = true)
        {
            await ClearDb();
            (string Hash, string Salt) hashSalt = ("", "");
            WithService<Services.ICryptoService>((c) =>
            {
                hashSalt = c.GenerateSaltedHash(DefaultUserPassword);
            });
            await WithDb(async (db) =>
            {
                var customers = new List<UserRecord>();
                var owners = new List<UserRecord>();
                var restaurants = new List<RestaurantRecord>();
                if (addUsers)
                {
                    for (var i = 1; i < 10; i++)
                        customers.Add(new UserRecord() { Email = $"customer{i}@hm.com", FirstName = $"FirstName{i}", LastName = $"LastName{i}", AddressCityZip = $"1000{i}", AddressCity = $"City {i}", AddressStreet = $"Street {i}", IsRestaurantOwner = false, PasswordHash = hashSalt.Hash, PasswordSalt = hashSalt.Salt });
                    for (var i = 1; i < 10; i++)
                        owners.Add(new UserRecord() { Email = $"owner{i}@hm.com", FirstName = $"FirstName{i}", LastName = $"LastName{i}", AddressCityZip = $"1000{i}", AddressCity = $"City {i}", AddressStreet = $"Street {i}", IsRestaurantOwner = true, PasswordHash = hashSalt.Hash, PasswordSalt = hashSalt.Salt });

                    db.Users.AddRange(customers);
                    db.Users.AddRange(owners);
                }
                if (addUsers && addRestaurants)
                {
                    foreach (var owner in owners)
                    {
                        for (var i = 1; i < 10; i++)
                        {
                            var r = new RestaurantRecord() { Name = $"Restaurant {owner.Email} - {i}", Description = $"Restaurant {i} description", DateCreated = DateTime.UtcNow, PhoneNumber = $"000{i}", Version = 1 };
                            for (var j = 1; j < 100; j++)
                                r.MenuItems.Add(new MenuItemRecord() { Name = $"Food {r.Name} {j}", Description = $"Description {r.Name} {j}", DateCreated = r.DateCreated, Price = j });
                            owner.Restaurants.Add(r);
                        }
                    }
                }
                await db.SaveChangesAsync();
            });
        }


        public void Dispose()
        {
            _server.Dispose();
        }
    }
}