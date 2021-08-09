using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class MenuItem
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }

        public virtual Restaurant Restaurant { get; set; }
    }
}
