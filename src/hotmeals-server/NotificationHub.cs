using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace hotmeals_server
{
    /// <summary>
    /// Signal-R notification hub. Used to send order update events to the connected client.
    /// Note: The hub has no methods because we are not expecting the client to call any methods via the signalR connection.
    /// </summary>
    [Authorize]
    public class NotificationHub : Hub
    {
        /// <summary>
        /// Name of the event which is published to the clients. The client may listen to this event to gather information about updated order.
        /// </summary>
        public const string OrderUpdateNotification = "OrderUpdated";
    }
}