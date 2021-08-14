using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class OrderRecord
    {
        public OrderRecord()
        {
            OrderItems = new HashSet<OrderItemRecord>();
            OrderHistory = new HashSet<OrderHistoryRecord>();
        }

        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid RestaurantId { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime DateCreated { get; set; }
        public decimal Total { get; set; }

        public virtual UserRecord Customer { get; set; }
        public virtual RestaurantRecord Restaurant { get; set; }
        public virtual ICollection<OrderItemRecord> OrderItems { get; set; }
        public virtual ICollection<OrderHistoryRecord> OrderHistory { get; set; }
    }

    public enum OrderStatus
    {
        Placed = 1,
        Accepted = 2,
        Shipped = 3,
        Delivered = 4,
        Received = 5,
        Canceled = 6
    }
}
