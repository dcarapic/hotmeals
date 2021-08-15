using System;
using System.ComponentModel.DataAnnotations;

namespace hotmeals_server.Model
{

    /// <summary>
    /// User information returned by server.
    /// </summary>
    public record UserDTO(string Email, string FirstName, string LastName, string AddressCityZip, string AddressCity, string AddressStreet, bool IsRestaurantOwner);

    /// <summary>
    /// Restaurant information returned by server.
    /// </summary>
    public record RestaurantDTO(Guid Id, string Name, string Description, string PhoneNumber);

    /// <summary>
    /// Restaurant menu iteminformation returned by server.
    /// </summary>
    public record MenuItemDTO(Guid MenuItemId, Guid RestaurantId, string Name, string Description, decimal Price);

    /// <summary>
    /// Restaurant menu item information returned by server.
    /// </summary>
    public record BlockedUserDTO(string Email, string FirstName, string LastName, string AddressCityZip, string AddressCity, string AddressStreet);

    /// <summary>
    /// Search menu item returned by server.
    /// </summary>
    public record SearchResultItemDTO(Guid MenuItemId, Guid RestaurantId, string RestaurantName, string Name, string Description, decimal Price);

    /// <summary>
    /// Order information returned by server.
    /// </summary>
    public record OrderDTO(Guid OrderId, Guid RestaurantId, string RestaurantName, Guid CustomerId, string CustomerEmail, string CustomerFirstName, string CustomerLastName, OrderStatus CurrentStatus, DateTime CreatedAt, decimal Total, OrderItemDTO[] Items, OrderHistoryDTO[] History)
    {
        /// <summary>
        /// Setter which accept UTC date and converts it to local date and stores it to CreatedAt property.
        /// </summary>
        /// <value></value>
        public DateTime CreatedAtUtc
        {
            init
            {
                this.CreatedAt = TimeZoneInfo.ConvertTimeFromUtc(value, TimeZoneInfo.Local);
            }
        }
    };

    public record OrderItemDTO(string Name, string Description, decimal Price, int Position, int Quantity);
    public record OrderHistoryDTO(OrderStatus Status, DateTime ChangedAt){
        /// <summary>
        /// Setter which accept UTC date and converts it to local date and stores it to ChangedAt property.
        /// </summary>
        /// <value></value>
        public DateTime ChangedAtUtc
        {
            init
            {
                this.ChangedAt = TimeZoneInfo.ConvertTimeFromUtc(value, TimeZoneInfo.Local);
            }
        }
    };



    /// <summary>
    /// Base API response containing success code and an error message in case of failing to perform the operation.
    /// </summary>
    public record APIResponse(bool IsSuccess, string ErrorMessage = null);


    public record LoginRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(500)] string Password);
    public record LoginResponse(UserDTO User, String JwtToken, int ExpiresInSeconds) : APIResponse(true, null);

    public record AuthenticateResponse(UserDTO User) : APIResponse(true, null);


    public record RegisterUserRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [Required][MaxLength(500)] string Password, bool IsRestaurantOwner);
    public record RegisterUserResponse(UserDTO User, String JwtToken, int ExpiresInSeconds) : APIResponse(true, null);

    public record UpdateUserRequest([Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [MaxLength(500)] string NewPassword) : APIResponse(true, null);
    public record UpdateUserResponse(UserDTO User) : APIResponse(true, null);

    public record GetRestaurantsResponse(RestaurantDTO[] Restaurants, int TotalPages, int Page) : APIResponse(true, null);

    public record NewRestaurantRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][MaxLength(20)] string PhoneNumber);
    public record NewRestaurantResponse(RestaurantDTO Restaurant) : APIResponse(true, null);

    public record UpdateRestaurantRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][MaxLength(20)] string PhoneNumber);
    public record UpdateRestaurantResponse(RestaurantDTO Restaurant) : APIResponse(true, null);


    public record GetMenuItemsResponse(Guid RestaurantId, string RestaurantName, string RestaurantDescription, string RestaurantPhoneNumber, MenuItemDTO[] MenuItems) : APIResponse(true, null);

    public record NewMenuItemRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][Range(0, 999999)] decimal Price);
    public record NewMenuItemResponse(MenuItemDTO MenuItem) : APIResponse(true, null);

    public record UpdateMenuItemRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][Range(0, 999999)] decimal Price);
    public record UpdateMenuItemResponse(MenuItemDTO MenuItem) : APIResponse(true, null);


    public record GetBlockedUsersResponse(BlockedUserDTO[] BlockedUsers) : APIResponse(true, null);
    public record BlockUserRequest([Required][MaxLength(100)] string Email);
    public record UnBlockUserRequest([Required][MaxLength(100)] string Email);

    public record SearchFoodResponse(SearchResultItemDTO[] Items, int TotalPages, int Page);

    public record PlaceOrderRequest([Required] Guid RestaurantId, [Required] PlaceOrderRequestMenuItem[] Items);
    public record PlaceOrderRequestMenuItem([Required] Guid MenuItemId, [Required][Range(0, 999999)] decimal Price, [Required][Range(1, 99)] int Quantity);
    public record PlaceOrderResponse(OrderDTO Order);

    public record GetOrderResponse(OrderDTO Order);
    public record GetOrdersResponse(OrderDTO[] Orders, int TotalPages, int Page);


    public record UpdateOrderRequest([Required] OrderStatus Status);
    public record UpdateOrderResponse(OrderDTO Order);

}