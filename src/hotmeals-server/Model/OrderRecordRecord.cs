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
        }

        public Guid Id { get; set; }
        public Guid CustomerId { get; set; }
        public Guid RestaurantId { get; set; }
        public int StatusId { get; set; }
        public DateTime DateCreated {get; set;}

        public virtual UserRecord Customer { get; set; }
        public virtual RestaurantRecord Restaurant { get; set; }
        public virtual ICollection<OrderItemRecord> OrderItems { get; set; }
    }
}
