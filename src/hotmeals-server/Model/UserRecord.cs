using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class UserRecord
    {
        public UserRecord()
        {
            BlockingUsers = new HashSet<BlockedUserRecord>();
            BlockedUsers = new HashSet<BlockedUserRecord>();
            Orders = new HashSet<OrderRecord>();
            Restaurants = new HashSet<RestaurantRecord>();
        }

        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FirstName { get; set; }
        public string LastName { get; set; }
        public string AddressCityZip { get; set; }
        public string AddressCity { get; set; }
        public string AddressStreet { get; set; }
        public string PasswordHash { get; set; }
        public string PasswordSalt { get; set; }
        public bool IsRestaurantOwner { get; set; }

        public virtual ICollection<BlockedUserRecord> BlockingUsers { get; set; }
        public virtual ICollection<BlockedUserRecord> BlockedUsers { get; set; }
        public virtual ICollection<OrderRecord> Orders { get; set; }
        public virtual ICollection<RestaurantRecord> Restaurants { get; set; }
    }
}
