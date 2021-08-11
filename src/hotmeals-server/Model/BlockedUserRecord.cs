using System;
using System.Collections.Generic;

#nullable disable

namespace hotmeals_server.Model
{
    public partial class BlockedUserRecord
    {
        public Guid UserId { get; set; }
        public Guid RestaurantId { get; set; }

        public virtual RestaurantRecord Restaurant { get; set; }
        public virtual UserRecord User { get; set; }
    }
}
