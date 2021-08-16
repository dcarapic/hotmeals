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
using System.Collections.Generic;

namespace hotmeals_server.tests
{
    public class OrderControllerTests : ControllerTestBase, IDisposable
    {

        [Fact]
        public async Task GetActiveOrders_Customer()
        {
            await SeedDb(addOrders: true, ownerCount: 2, customerCount: 1, restaurantCount: 2, activeOrderCount: 2, completedOrderCount: 1);
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.Include(x => x.Orders).FirstAsync(x => !x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/orders/active", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetOrdersResponse>(JsonSerializerOptions);
            // 2 owners = 4 restaurants = 6 active orders
            Assert.Equal(2 * 2 * 2, result.Orders.Length);
        }


        [Fact]
        public async Task GetActiveOrders_Owner()
        {
            await SeedDb(addOrders: true, ownerCount: 2, customerCount: 1, restaurantCount: 2, activeOrderCount: 2, completedOrderCount: 1);
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/orders/active", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetOrdersResponse>(JsonSerializerOptions);
            // single owner with 2 restaurants
            Assert.Equal(2 * 2, result.Orders.Length);
        }


        [Fact]
        public async Task GetCompletedOrders_Customer()
        {
            await SeedDb(addOrders: true, ownerCount: 2, customerCount: 1, restaurantCount: 2, activeOrderCount: 2, completedOrderCount: 1);
            UserRecord customer = null;
            await WithDb(async db =>
            {
                customer = await db.Users.Include(x => x.Orders).FirstAsync(x => !x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/orders/completed", customer);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetOrdersResponse>(JsonSerializerOptions);
            // 2 owners = 4 restaurants = 4 completed orders
            Assert.Equal(2 * 2, result.Orders.Length);
        }


        [Fact]
        public async Task GetCompletedOrders_Owner()
        {
            await SeedDb(addOrders: true, ownerCount: 2, customerCount: 1, restaurantCount: 2, activeOrderCount: 2, completedOrderCount: 1);
            UserRecord owner = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
            });

            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Get, $"/api/orders/completed", owner);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<GetOrdersResponse>(JsonSerializerOptions);
            // single owner with 2 restaurants
            Assert.Equal(2, result.Orders.Length);
        }


        [Fact]
        public async Task PlaceOrder_OK()
        {
            await SeedDb(menuItemCount: 3);
            UserRecord customer = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync();
            });

            var reqItems = new List<PlaceOrderRequestMenuItem>();
            foreach (var mi in r.MenuItems)
                reqItems.Add(new PlaceOrderRequestMenuItem(mi.Id, mi.Price, 2));
            var req = new PlaceOrderRequest(r.Id, reqItems.ToArray());
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", customer);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);
            var result = await res.Content.ReadFromJsonAsync<PlaceOrderResponse>(JsonSerializerOptions);
            await WithDb(async db =>
            {
                Assert.Single(db.Orders);
                var order = await db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory).FirstAsync();
                Assert.Equal(OrderStatus.Placed, order.Status);
                Assert.Equal(customer.Id, order.CustomerId);
                foreach (var item in req.Items)
                {
                    var mi = r.MenuItems.First(x => x.Id == item.MenuItemId);
                    var omi = order.OrderItems.First(x => x.MenuItemName == mi.Name);
                    Assert.Equal(item.Price, omi.PricePerItem);
                    Assert.Equal(item.Quantity, omi.Quantity);
                }
                Assert.Single(order.OrderHistory);
                Assert.Equal(OrderStatus.Placed, order.OrderHistory.First().Status);
            });
        }

        [Fact]
        public async Task PlaceOrder_OnlyCustomer()
        {
            await SeedDb(menuItemCount: 3);
            UserRecord owner = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync();
            });
            var reqItems = new List<PlaceOrderRequestMenuItem>();
            foreach (var mi in r.MenuItems)
                reqItems.Add(new PlaceOrderRequestMenuItem(mi.Id, mi.Price, 2));

            // Invalid restaurant Id
            var req = new PlaceOrderRequest(r.Id, reqItems.ToArray());
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", owner);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.Forbidden, res.StatusCode);
        }



        [Fact]
        public async Task PlaceOrder_InvalidOrder()
        {
            await SeedDb(menuItemCount: 3);
            UserRecord customer = null;
            RestaurantRecord r = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                r = await db.Restaurants.Include(x => x.MenuItems).FirstAsync();
            });
            var reqItems = new List<PlaceOrderRequestMenuItem>();
            foreach (var mi in r.MenuItems)
                reqItems.Add(new PlaceOrderRequestMenuItem(mi.Id, mi.Price, 2));

            // Invalid restaurant Id
            var req = new PlaceOrderRequest(Guid.NewGuid(), reqItems.ToArray());
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", customer);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

            // No items
            reqItems.Clear();
            req = new PlaceOrderRequest(r.Id, reqItems.ToArray());
            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", customer);
            hrm.Content = JsonContent.Create(req);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);


            // Invalid menu item Id
            reqItems.Clear();
            foreach (var mi in r.MenuItems)
                reqItems.Add(new PlaceOrderRequestMenuItem(Guid.NewGuid(), mi.Price, 2));

            req = new PlaceOrderRequest(Guid.NewGuid(), reqItems.ToArray());
            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", customer);
            hrm.Content = JsonContent.Create(req);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);


            // Non-matching price
            reqItems.Clear();
            foreach (var mi in r.MenuItems)
                reqItems.Add(new PlaceOrderRequestMenuItem(mi.Id, mi.Price + 2, 2));

            req = new PlaceOrderRequest(r.Id, reqItems.ToArray());
            hrm = this.CreateAuthenticatedRequest(HttpMethod.Post, $"/api/orders", customer);
            hrm.Content = JsonContent.Create(req);
            res = await Client.SendAsync(hrm);
            Assert.Equal(System.Net.HttpStatusCode.BadRequest, res.StatusCode);

        }

        [Fact]
        public async Task UpdateOrder_ToCompletion()
        {
            await SeedDb(customerCount: 1, ownerCount: 1, restaurantCount: 1, menuItemCount: 3, addOrders: true, activeOrderCount: 1, completedOrderCount: 0);
            UserRecord customer = null;
            UserRecord owner = null;
            RestaurantRecord r = null;
            OrderRecord order = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.FirstAsync();
                order = await db.Orders.FirstAsync();
            });

            // Try invalid statuses first
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, customer, expectFail: true);
            // Accept
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, owner, expectFail: false);

            // Try invalid statuses first
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, customer, expectFail: true);
            // Ship
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, owner, expectFail: false);

            // Try invalid statuses first
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, customer, expectFail: true);
            // Deliver
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, owner, expectFail: false);

            // Try invalid statuses first
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Placed, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Accepted, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Shipped, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, customer, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Delivered, owner, expectFail: true);
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, owner, expectFail: true);
            // Deliver
            await TryUpdateOrderStatus(order.Id, OrderStatus.Received, customer, expectFail: false);

        }


        [Fact]
        public async Task UpdateOrder_Cancel()
        {
            await SeedDb(customerCount: 1, ownerCount: 1, restaurantCount: 1, menuItemCount: 3, addOrders: true, activeOrderCount: 1, completedOrderCount: 0);
            UserRecord customer = null;
            UserRecord owner = null;
            RestaurantRecord r = null;
            OrderRecord order = null;
            await WithDb(async db =>
            {
                customer = await db.Users.FirstAsync(x => !x.IsRestaurantOwner);
                owner = await db.Users.FirstAsync(x => x.IsRestaurantOwner);
                r = await db.Restaurants.FirstAsync();
                order = await db.Orders.FirstAsync();
            });
            // Try invalid user first
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, owner, expectFail: true);
            // Cancel
            await TryUpdateOrderStatus(order.Id, OrderStatus.Canceled, customer, expectFail: false);
        }


        private async Task<HttpResponseMessage> TryUpdateOrderStatus(Guid orderId, OrderStatus status, UserRecord user, bool expectFail)
        {
            var req = new UpdateOrderRequest(status);
            var hrm = this.CreateAuthenticatedRequest(HttpMethod.Put, $"/api/orders/{Uri.EscapeDataString(orderId.ToString())}", user);
            hrm.Content = JsonContent.Create(req);
            var res = await Client.SendAsync(hrm);
            if (expectFail)
                Assert.NotEqual(System.Net.HttpStatusCode.OK, res.StatusCode);
            else
                Assert.Equal(System.Net.HttpStatusCode.OK, res.StatusCode);

            if (res.StatusCode == System.Net.HttpStatusCode.OK)
                await WithDb(async db =>
                {
                    var order = await db.Orders.Include(x => x.OrderHistory).FirstAsync();
                    Assert.Equal(status, order.Status);
                    Assert.Equal(status, order.OrderHistory.Last().Status);
                });

            return res;
        }

    }
}
