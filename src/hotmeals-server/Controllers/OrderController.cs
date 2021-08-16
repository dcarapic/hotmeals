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
using Microsoft.AspNetCore.SignalR;

namespace hotmeals_server.Controllers
{
    /// <summary>
    /// Controller for handling order related commands and queries.
    /// </summary>
    [Route("api/orders")]
    [ApiController]
    [Authorize]
    public class OrderController : BaseController
    {

        const int OrdersResultPageSize = 20;

        private readonly ILogger<OrderController> _log;
        private readonly HMContext _db;
        private readonly IHubContext<NotificationHub> _hub;

        public OrderController(ILogger<OrderController> logger, HMContext db, IHubContext<NotificationHub> hub)
        {
            _hub = hub;
            _log = logger;
            _db = db;
        }

        /// <summary>
        /// Returns the list of all active orders. 
        /// If the current user is a customer then all orders of that customer are returned. 
        /// If the current user is a restaurant owner then orders for all restaurants are returned.
        /// The results are paged.
        /// </summary>
        /// <returns></returns>
        [HttpGet("active")]
        public async Task<IActionResult> GetActiveOrders([FromQuery] int page = 1)
        {
            return await GetOrders(new OrderStatus[] { OrderStatus.Placed, OrderStatus.Accepted, OrderStatus.Shipped, OrderStatus.Delivered }, page);
        }

        /// <summary>
        /// Returns the list of all completed orders. 
        /// If the current user is a customer then all orders of that customer are returned. 
        /// If the current user is a restaurant owner then orders for all restaurants are returned.
        /// The results are paged.
        /// </summary>
        /// <returns></returns>
        [HttpGet("completed")]
        public async Task<IActionResult> GetCompletedOrders([FromQuery] int page = 1)
        {
            return await GetOrders(new OrderStatus[] { OrderStatus.Received, OrderStatus.Canceled }, page);
        }

        private async Task<IActionResult> GetOrders(OrderStatus[] statuses, int page)
        {
            IQueryable<OrderDTO> qry;
            var totalPages = 1;

            // Unfortunately we can not name the record constructor arguments within the query as it is not supported by IQueryable
            if (this.ApplicationUser.IsRestaurantOwner)
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where r.OwnerId == ApplicationUser.Id && statuses.Contains(o.Status)
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged) { ChangedAtUtc = x.DateChanged }).ToArray()) { CreatedAtUtc = o.DateCreated };

            }
            else
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where o.CustomerId == ApplicationUser.Id && statuses.Contains(o.Status)
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged) { ChangedAtUtc = x.DateChanged }).ToArray()) { CreatedAtUtc = o.DateCreated };
            }
            var total = (int)(await qry.CountAsync());
            totalPages = total == 0 ? 0 : (total / OrdersResultPageSize) + 1;
            qry = qry.Skip(page - 1).Take(OrdersResultPageSize);
            var orders = await qry.ToArrayAsync();
            return Ok(new GetOrdersResponse(orders, TotalPages: totalPages, Page: 1));
        }


        /// <summary>
        /// Adds a new order for the currently logged on customer.
        /// </summary>
        [HttpPost]
        [Authorize(Roles = Services.JwtServiceDefaults.RoleCustomer)]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest req)
        {
            var restaurant = await _db.Restaurants.Include(x => x.MenuItems).Include(x => x.Owner).FirstOrDefaultAsync(x => x.Id == req.RestaurantId);
            if (restaurant == null)
                return BadRequest(new APIResponse(false, "The restaurant does not exist."));

            var currentUser = await _db.Users.FindAsync(this.ApplicationUser.Id);
            if (currentUser == null)
                return this.Unauthorized(new APIResponse(false, $"You are not authorized"));

            var order = new OrderRecord();
            order.RestaurantId = req.RestaurantId;
            order.Status = OrderStatus.Placed;
            order.CustomerId = this.ApplicationUser.Id;
            order.DateCreated = DateTime.UtcNow;

            if (req.Items.Length == 0)
                return BadRequest(new APIResponse(false, "Please provide at least one menu item."));


            // Create order items
            for (var i = 0; i < req.Items.Length; i++)
            {
                var reqItem = req.Items[i];
                var menuItem = restaurant.MenuItems.FirstOrDefault(x => x.Id == reqItem.MenuItemId);
                if (menuItem == null)
                    return BadRequest(new APIResponse(false, "Unfortunately one of the menu items was removed by the restaurant owner. Please create a new order."));
                if (menuItem.Price != reqItem.Price)
                    return BadRequest(new APIResponse(false, "Unfortunately one of the menu items price has change. Please create a new order."));
                order.OrderItems.Add(new OrderItemRecord() { Position = i + 1, MenuItemName = menuItem.Name, MenuItemDescription = menuItem.Description, Quantity = reqItem.Quantity, PricePerItem = menuItem.Price });
            }
            order.Total = order.OrderItems.Sum(x => Math.Round(x.PricePerItem * x.Quantity, 2));
            order.OrderHistory.Add(new OrderHistoryRecord() { Status = OrderStatus.Placed, DateChanged = order.DateCreated });

            _db.Orders.Add(order);
            await _db.SaveChangesAsync();

            var dto = new OrderDTO(
                OrderId: order.Id,
                RestaurantId: order.RestaurantId,
                RestaurantName: restaurant.Name,
                CustomerId: order.CustomerId,
                CustomerEmail: currentUser.Email,
                CustomerFirstName: currentUser.FirstName,
                CustomerLastName: currentUser.LastName,
                CurrentStatus: order.Status,
                CreatedAt: TimeZoneInfo.ConvertTimeFromUtc(order.DateCreated, TimeZoneInfo.Local),
                Total: order.Total,
                Items: order.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(),
                History: order.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());

            // Notify customer and owner over websockets
            // Note - we are not awaiting results, we do not care if recipients never receive the information
            _ = _hub.Clients.User(dto.CustomerEmail).SendAsync(NotificationHub.OrderUpdateNotification, dto);
            _ = _hub.Clients.User(restaurant.Owner.Email).SendAsync(NotificationHub.OrderUpdateNotification, dto);

            _log.LogInformation($"Customer {ApplicationUser.Email} placed a new order {order.Id} / {order.Total:n2} € for restaurant '{restaurant.Name}' ({restaurant.Owner.Email})");
            return Ok(new PlaceOrderResponse(dto));
        }

        /// <summary>
        /// Updates the order of the currently logged on user.
        /// </summary>
        [HttpPut("{orderId}")]
        public async Task<IActionResult> UpdateOrder(Guid orderId, [FromBody] UpdateOrderRequest req)
        {
            var order = await _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory).Include(x => x.Customer).Include(x => x.Restaurant).ThenInclude(x => x.Owner).FirstOrDefaultAsync(x => x.Id == orderId);
            // Check if order exists and that the user can access it (is either customer or owner)
            if (order == null || (this.ApplicationUser.IsCustomer && order.CustomerId != this.ApplicationUser.Id) || (this.ApplicationUser.IsRestaurantOwner && order.Restaurant.OwnerId != this.ApplicationUser.Id))
                return BadRequest(new APIResponse(false, "Order does not exist!"));

            // Validate status
            switch (req.Status)
            {
                case OrderStatus.Placed: // Placed is only when order is being placed
                    return BadRequest(new APIResponse(false, $"You may not mark the order as placed!"));

                case OrderStatus.Accepted:
                    if (order.Status != OrderStatus.Placed)
                        return BadRequest(new APIResponse(false, $"Order is {order.Status.ToString()}. You not mark it as accepted!"));
                    if (!this.ApplicationUser.IsRestaurantOwner)
                        return BadRequest(new APIResponse(false, $"You do not have permission to change the order status to {req.Status.ToString()}!"));
                    break;

                case OrderStatus.Shipped:
                    if (order.Status != OrderStatus.Accepted)
                        return BadRequest(new APIResponse(false, $"Order is {order.Status.ToString()}. You not mark it as shipped!"));
                    if (!this.ApplicationUser.IsRestaurantOwner)
                        return BadRequest(new APIResponse(false, $"You do not have permission to change the order status to {req.Status.ToString()}!"));
                    break;

                case OrderStatus.Delivered:
                    if (order.Status != OrderStatus.Shipped)
                        return BadRequest(new APIResponse(false, $"Order is {order.Status.ToString()}. You may not mark it as delivered!"));
                    if (!this.ApplicationUser.IsRestaurantOwner)
                        return BadRequest(new APIResponse(false, $"You do not have permission to change the order status to {req.Status.ToString()}!"));
                    break;

                case OrderStatus.Received:
                    if (order.Status != OrderStatus.Delivered)
                        return BadRequest(new APIResponse(false, $"Order is {order.Status.ToString()}. You may not mark it as received!"));
                    if (!this.ApplicationUser.IsCustomer)
                        return BadRequest(new APIResponse(false, $"You do not have permission to change the order status to {req.Status.ToString()}!"));
                    break;

                case OrderStatus.Canceled:
                    if (order.Status != OrderStatus.Placed)
                        return BadRequest(new APIResponse(false, $"Order is {order.Status.ToString()}. You may no longer cancel it!"));
                    if (!this.ApplicationUser.IsCustomer)
                        return BadRequest(new APIResponse(false, $"You do not have permission to change the order status to {req.Status.ToString()}!"));
                    break;
            }

            order.Status = req.Status;
            order.OrderHistory.Add(new OrderHistoryRecord() { Status = req.Status, DateChanged = DateTime.UtcNow });
            await _db.SaveChangesAsync();

            var dto = new OrderDTO(
                OrderId: order.Id,
                RestaurantId: order.RestaurantId,
                RestaurantName: order.Restaurant.Name,
                CustomerId: order.CustomerId,
                CustomerEmail: order.Customer.Email,
                CustomerFirstName: order.Customer.FirstName,
                CustomerLastName: order.Customer.LastName,
                CurrentStatus: order.Status,
                CreatedAt: TimeZoneInfo.ConvertTimeFromUtc(order.DateCreated, TimeZoneInfo.Local),
                Total: order.Total,
                Items: order.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(),
                History: order.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, TimeZoneInfo.ConvertTimeFromUtc(x.DateChanged, TimeZoneInfo.Local))).ToArray());

            // Notify customer and owner over websockets
            // Note - we are not awaiting results, we do not care if recipients never receive the information
            _ = _hub.Clients.User(dto.CustomerEmail).SendAsync(NotificationHub.OrderUpdateNotification, dto);
            _ = _hub.Clients.User(order.Restaurant.Owner.Email).SendAsync(NotificationHub.OrderUpdateNotification, dto);
            _log.LogInformation($"Customer {ApplicationUser.Email} updated the order {dto.OrderId} / {dto.Total:n2} € to status {req.Status} (restaurant '{order.Restaurant.Name}' / {order.Restaurant.Owner.Email})");


            return Ok(new PlaceOrderResponse(dto));
        }
    }
}
