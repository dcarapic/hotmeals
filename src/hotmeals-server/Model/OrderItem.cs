using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class OrderItemRecord
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public string MenuItemName { get; set; }
        public string MenuItemDescription { get; set; }
        public long Quantity { get; set; }
        public decimal PricePerItem { get; set; }

        public virtual OrderRecord Order { get; set; }
    }
}
