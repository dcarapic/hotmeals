using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class User
    {
        public User()
        {
            BlockedUsers = new HashSet<BlockedUser>();
            Orders = new HashSet<Order>();
            Restaurants = new HashSet<Restaurant>();
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

        public virtual ICollection<BlockedUser> BlockedUsers { get; set; }
        public virtual ICollection<Order> Orders { get; set; }
        public virtual ICollection<Restaurant> Restaurants { get; set; }
    }
}
