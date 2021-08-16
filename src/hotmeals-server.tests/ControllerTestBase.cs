using hotmeals_server.Model;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Linq;
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


        public System.Text.Json.JsonSerializerOptions JsonSerializerOptions
        {
            get
            {
                var opts = new System.Text.Json.JsonSerializerOptions(System.Text.Json.JsonSerializerDefaults.Web);
                var enumConverter = new System.Text.Json.Serialization.JsonStringEnumConverter();
                opts.Converters.Add(enumConverter);
                return opts;
            }
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

        public async Task SeedDb(bool addUsers = true, bool addRestaurants = true, bool addOrders = false, int customerCount = 10, int ownerCount = 10, int restaurantCount = 10, int menuItemCount = 100, int activeOrderCount = 2, int completedOrderCount = 2)
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
                    for (var i = 1; i < customerCount + 1; i++)
                        customers.Add(new UserRecord() { Email = $"customer{i}@hm.com", FirstName = $"FirstName{i}", LastName = $"LastName{i}", AddressCityZip = $"1000{i}", AddressCity = $"City {i}", AddressStreet = $"Street {i}", IsRestaurantOwner = false, PasswordHash = hashSalt.Hash, PasswordSalt = hashSalt.Salt });
                    for (var i = 1; i < ownerCount + 1; i++)
                        owners.Add(new UserRecord() { Email = $"owner{i}@hm.com", FirstName = $"FirstName{i}", LastName = $"LastName{i}", AddressCityZip = $"1000{i}", AddressCity = $"City {i}", AddressStreet = $"Street {i}", IsRestaurantOwner = true, PasswordHash = hashSalt.Hash, PasswordSalt = hashSalt.Salt });

                    db.Users.AddRange(customers);
                    db.Users.AddRange(owners);
                }
                if (addUsers && addRestaurants)
                {
                    foreach (var owner in owners)
                    {
                        for (var i = 1; i < restaurantCount + 1; i++)
                        {
                            var r = new RestaurantRecord() { Name = $"Restaurant {owner.Email} - {i}", Description = $"Restaurant {i} description", DateCreated = DateTime.UtcNow, PhoneNumber = $"000{i}", Version = 1 };
                            for (var j = 1; j < menuItemCount + 1; j++)
                                r.MenuItems.Add(new MenuItemRecord() { Name = $"Food {r.Name} {j}", Description = $"Description {r.Name} {j}", DateCreated = r.DateCreated, Price = j });
                            owner.Restaurants.Add(r);
                        }
                    }
                }
                await db.SaveChangesAsync();

                if (addUsers && addRestaurants && addOrders)
                {
                    foreach (var customer in customers)
                    {
                        foreach (var owner in owners)
                        {
                            foreach (var r in owner.Restaurants)
                            {
                                for (var i = 0; i < activeOrderCount + completedOrderCount; i++)
                                {
                                    var o = new OrderRecord() { CustomerId = customer.Id, RestaurantId = r.Id, DateCreated = DateTime.UtcNow };
                                    for (var j = 0; j < Math.Min(5, r.MenuItems.Count); j++)
                                    {
                                        var mi = r.MenuItems.Skip(j).First();
                                        o.OrderItems.Add(new OrderItemRecord() { MenuItemName = mi.Name, MenuItemDescription = mi.Description, Position = j + 1, PricePerItem = mi.Price, Quantity = j });
                                        o.Status = OrderStatus.Placed;
                                    }
                                    o.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Placed, DateChanged = DateTime.UtcNow });
                                    if (i >= activeOrderCount)
                                    {
                                        o.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Accepted, DateChanged = DateTime.UtcNow });
                                        o.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Shipped, DateChanged = DateTime.UtcNow });
                                        o.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Delivered, DateChanged = DateTime.UtcNow });
                                        o.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Received, DateChanged = DateTime.UtcNow });
                                        o.Status = OrderStatus.Received;
                                    }
                                    db.Orders.Add(o);
                                }

                            }
                        }
                    }
                    await db.SaveChangesAsync();
                }

            });
        }


        public void Dispose()
        {
            _server.Dispose();
        }
    }
}