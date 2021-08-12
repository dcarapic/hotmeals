using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class BlockedUserRecord
    {
        public Guid UserId { get; set; }
        public Guid RestaurantOwnerId { get; set; }
        public DateTime DateCreated {get; set;}
        public virtual UserRecord User { get; set; }
        public virtual UserRecord RestaurantOwner { get; set; }
    }
}
