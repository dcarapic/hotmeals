using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace hotmeals_server
{
    [Authorize]
    public class NotificationHub : Hub
    {

        public const string OrderUpdateNotification = "OrderUpdated";
    }
}