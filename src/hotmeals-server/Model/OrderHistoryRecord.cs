using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class OrderHistoryRecord
    {
        public Guid Id { get; set; }
        public Guid OrderId { get; set; }
        public OrderStatus Status { get; set; }
        public DateTime DateChanged { get; set; }
        
        public virtual OrderRecord Order { get; set; }
    }
}
