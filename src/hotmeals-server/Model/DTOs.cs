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
    public record MenuItemDTO(Guid Id, Guid RestaurantId, string Name, string Description, decimal Price);    

    /// <summary>
    /// Base API response containing success code and an error message in case of failing to perform the operation.
    /// </summary>
    public record APIResponse(bool IsSuccess, string ErrorMessage = null);


    public record LoginRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(500)] string Password);
    public record LoginResponse(UserDTO User) : APIResponse(true, null);



    public record RegisterUserRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [Required][MaxLength(500)] string Password, bool IsRestaurantOwner);
    public record RegisterUserResponse(UserDTO User) : APIResponse(true, null);

    public record UpdateUserRequest([Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [MaxLength(500)] string NewPassword) : APIResponse(true, null);
    public record UpdateUserResponse(UserDTO User) : APIResponse(true, null);

    public record GetRestaurantsResponse(RestaurantDTO[] Restaurants) : APIResponse(true, null);

    public record NewRestaurantRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][MaxLength(20)] string PhoneNumber);
    public record NewRestaurantResponse(RestaurantDTO Restaurant) : APIResponse(true, null);

    public record UpdateRestaurantRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][MaxLength(20)] string PhoneNumber);
    public record UpdateRestaurantResponse(RestaurantDTO Restaurant) : APIResponse(true, null);


    public record GetMenuItemsResponse(MenuItemDTO[] MenuItems) : APIResponse(true, null);

    public record NewMenuItemRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][Range(0, 999999)]decimal Price);
    public record NewMenuItemResponse(MenuItemDTO MenuItem) : APIResponse(true, null);

    public record UpdateMenuItemRequest([Required][MaxLength(100)] string Name, [Required][MaxLength(2000)] string Description, [Required][Range(0, 999999)]decimal Price);
    public record UpdateMenuItemResponse(MenuItemDTO MenuItem) : APIResponse(true, null);


}