using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class MenuItemRecord
    {
        public Guid Id { get; set; }
        public Guid RestaurantId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public decimal Price { get; set; }
        public DateTime DateCreated {get; set;}

        public virtual RestaurantRecord Restaurant { get; set; }
    }
}
