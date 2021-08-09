using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class Order
    {
        public Order()
        {
            OrderItems = new HashSet<OrderItem>();
        }

        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid RestaurantId { get; set; }
        public int StatusId { get; set; }

        public virtual User Customer { get; set; }
        public virtual Restaurant Restaurant { get; set; }
        public virtual ICollection<OrderItem> OrderItems { get; set; }
    }
}
