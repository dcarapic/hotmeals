using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class RestaurantRecord
    {
        public RestaurantRecord()
        {
            BlockedUsers = new HashSet<BlockedUserRecord>();
            MenuItems = new HashSet<MenuItemRecord>();
            Orders = new HashSet<OrderRecord>();
        }

        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string PhoneNumber { get; set; }

        public virtual UserRecord Owner { get; set; }
        public virtual ICollection<BlockedUserRecord> BlockedUsers { get; set; }
        public virtual ICollection<MenuItemRecord> MenuItems { get; set; }
        public virtual ICollection<OrderRecord> Orders { get; set; }
    }
}
