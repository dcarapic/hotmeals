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

        ILogger<OrderController> _log;
        private HMContext _db;
        const int OrdersResultPageSize = 20;

        public OrderController(ILogger<OrderController> logger, HMContext db)
        {
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
            return await GetOrders(new OrderStatus[] { OrderStatus.Placed, OrderStatus.Accepted, OrderStatus.Shipped, OrderStatus.Delivered, OrderStatus.Received }, page);
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

            if (this.CurrentUser.IsRestaurantOwner)
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where r.OwnerId == CurrentUser.Id && statuses.Contains(o.Status)
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());

            }
            else
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where o.CustomerId == CurrentUser.Id && statuses.Contains(o.Status)
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());
            }
            var total = (int)(await qry.CountAsync());
            totalPages = total == 0 ? 0 : (total / OrdersResultPageSize) + 1;
            qry = qry.Skip(page - 1).Take(OrdersResultPageSize);

            return Ok(new GetOrdersResponse(await qry.ToArrayAsync(), TotalPages: totalPages, Page: 1));
        }


        /// <summary>
        /// Fetches an order. 
        /// Customer may only fetch orders where he is the customer.
        /// Owner may only fetch orders for his restaurants.
        /// </summary>
        /// <returns></returns>
        [HttpGet("{orderId}")]
        public async Task<IActionResult> GetOrder(Guid orderId)
        {
            IQueryable<OrderDTO> qry;
            if (this.CurrentUser.IsRestaurantOwner)
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where r.OwnerId == CurrentUser.Id
                      where o.Id == orderId
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());

            }
            else
            {
                qry = from o in _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory)
                      join r in _db.Restaurants on o.RestaurantId equals r.Id
                      join c in _db.Users on o.CustomerId equals c.Id
                      where o.CustomerId == CurrentUser.Id
                      where o.Id == orderId
                      orderby r.DateCreated
                      select new OrderDTO(o.Id, o.RestaurantId, r.Name, o.CustomerId, c.Email, c.FirstName, c.LastName, o.Status, o.DateCreated, o.Total, o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(), o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());
            }
            var order = await qry.FirstOrDefaultAsync();
            if (order == null)
                return BadRequest(new APIResponse(false, "Order does not exist!"));
            return Ok(new GetOrderResponse(order));
        }

        /// <summary>
        /// Adds a new order for the currently logged on user.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> PlaceOrder([FromBody] PlaceOrderRequest req)
        {
            if (!this.CurrentUser.IsCustomer)
                return Unauthorized(new APIResponse(false, "Only customers may place orders!"));

            var r = await _db.Restaurants.Include(x => x.MenuItems).FirstOrDefaultAsync(x => x.Id == req.RestaurantId);
            var u = await _db.Users.FindAsync(this.CurrentUser.Id);
            var o = new OrderRecord();
            o.RestaurantId = req.RestaurantId;
            o.Status = OrderStatus.Placed;
            o.CustomerId = this.CurrentUser.Id;
            o.DateCreated = DateTime.UtcNow;

            for (var i = 0; i < req.Items.Length; i++)
            {
                var reqItem = req.Items[i];
                var menuItem = r.MenuItems.FirstOrDefault(x => x.Id == reqItem.MenuItemId);
                if (menuItem == null)
                    return BadRequest(new APIResponse(false, "Unfortunately one of the menu items was removed by the restaurant owner. Please create a new order."));
                if (menuItem.Price != reqItem.Price)
                    return BadRequest(new APIResponse(false, "Unfortunately one of the menu items price has change. Please create a new order."));
                o.OrderItems.Add(new OrderItemRecord() { Position = i + 1, MenuItemName = menuItem.Name, MenuItemDescription = menuItem.Description, Quantity = reqItem.Quantity, PricePerItem = menuItem.Price });
            }


            _db.Orders.Add(o);
            await _db.SaveChangesAsync();

            var dto = new OrderDTO(
                OrderId: o.Id,
                RestaurantId: o.RestaurantId,
                RestaurantName: r.Name,
                CustomerId: o.CustomerId,
                CustomerEmail: u.Email,
                CustomerFirstName: u.FirstName,
                CustomerLastName: u.LastName,
                CurrentStatus: o.Status,
                CreatedAt: o.DateCreated,
                Total: o.Total,
                Items: o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(),
                History: o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());

            return Ok(new PlaceOrderResponse(dto));
        }

        /// <summary>
        /// Updates the order of the currently logged on user.
        /// </summary>
        [HttpPut("{orderId}")]
        public async Task<IActionResult> UpdateOrder(Guid orderId, [FromBody] UpdateOrderRequest req)
        {
            var o = await _db.Orders.Include(x => x.OrderItems).Include(x => x.OrderHistory).Include(x => x.Restaurant).Include(x => x.Customer).FirstOrDefaultAsync(x => x.Id == orderId);
            // Check if order exists and that the user can access it (is either customer or owner)
            if (o == null || (this.CurrentUser.IsCustomer && o.CustomerId != this.CurrentUser.Id) || (this.CurrentUser.IsRestaurantOwner && o.Restaurant.OwnerId != this.CurrentUser.Id))
                return BadRequest(new APIResponse(false, "Order does not exist!"));

            // Validate status
            switch (req.Status)
            {
                case OrderStatus.Placed: // Placed is only when order is being placed

                case OrderStatus.Accepted:
                    if (o.Status != OrderStatus.Placed)
                        return BadRequest(new APIResponse(false, $"Order is {o.Status.ToString()}. You not mark it as accepted!"));
                    if (!this.CurrentUser.IsRestaurantOwner)
                        return BadRequest(new APIResponse(false, $"You may not change order status to {o.Status.ToString()}!"));
                    break;

                case OrderStatus.Shipped:
                    if (o.Status != OrderStatus.Accepted)
                        return BadRequest(new APIResponse(false, $"Order is {o.Status.ToString()}. You not mark it as shipped!"));
                    if (!this.CurrentUser.IsRestaurantOwner)
                        return BadRequest(new APIResponse(false, $"You may not change order status to {o.Status.ToString()}!"));
                    break;

                case OrderStatus.Delivered:
                    if (o.Status != OrderStatus.Shipped)
                        return BadRequest(new APIResponse(false, $"Order is {o.Status.ToString()}. You may not mark it as delivered!"));
                    if (!this.CurrentUser.IsCustomer)
                        return BadRequest(new APIResponse(false, $"You may not change order status to {o.Status.ToString()}!"));
                    break;

                case OrderStatus.Received:
                    if (o.Status != OrderStatus.Shipped && o.Status != OrderStatus.Delivered)
                        return BadRequest(new APIResponse(false, $"Order is {o.Status.ToString()}. You may not mark it as received!"));
                    if (!this.CurrentUser.IsCustomer)
                        return BadRequest(new APIResponse(false, $"You may not change order status to {o.Status.ToString()}!"));
                    break;

                case OrderStatus.Canceled:
                    if (o.Status != OrderStatus.Placed)
                        return BadRequest(new APIResponse(false, $"Order is {o.Status.ToString()}. You may no longer cancel it!"));
                    if (!this.CurrentUser.IsCustomer)
                        return BadRequest(new APIResponse(false, $"You may not change order status to {o.Status.ToString()}!"));
                    break;
            }

            o.Status = req.Status;
            o.OrderHistory.Add(new OrderHistoryRecord() { Status = req.Status, DateChanged = DateTime.Now });
            await _db.SaveChangesAsync();

            var dto = new OrderDTO(
                OrderId: o.Id,
                RestaurantId: o.RestaurantId,
                RestaurantName: o.Restaurant.Name,
                CustomerId: o.CustomerId,
                CustomerEmail: o.Customer.Email,
                CustomerFirstName: o.Customer.FirstName,
                CustomerLastName: o.Customer.LastName,
                CurrentStatus: o.Status,
                CreatedAt: o.DateCreated,
                Total: o.Total,
                Items: o.OrderItems.Select(x => new OrderItemDTO(x.MenuItemName, x.MenuItemDescription, x.PricePerItem, x.Position, x.Quantity)).ToArray(),
                History: o.OrderHistory.Select(x => new OrderHistoryDTO(x.Status, x.DateChanged)).ToArray());

            return Ok(new PlaceOrderResponse(dto));
        }
    }
}
