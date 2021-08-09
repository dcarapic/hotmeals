using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class Restaurant
    {
        public Restaurant()
        {
            BlockedUsers = new HashSet<BlockedUser>();
            MenuItems = new HashSet<MenuItem>();
            Orders = new HashSet<Order>();
        }

        public Guid Id { get; set; }
        public Guid OwnerId { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string AddressCityZip { get; set; }
        public string AddressCity { get; set; }
        public string AddressStreet { get; set; }
        public string PhoneNumber { get; set; }

        public virtual User Owner { get; set; }
        public virtual ICollection<BlockedUser> BlockedUsers { get; set; }
        public virtual ICollection<MenuItem> MenuItems { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
    }
}
