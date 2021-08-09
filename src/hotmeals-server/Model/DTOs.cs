using System;

namespace hotmeals_server.Model
{
    public record LoginRequest(string Email, string Password);
    public record UserResponse(string Email, string FirstName, string LastName, string AddressCityZip, string AddressCity, string AddressStreet, bool IsRestaurantOwner);
    public record RegisterUserRequest(string Email, string FirstName, string LastName, string AddressCityZip, string AddressCity, string AddressStreet, string Password, bool IsRestaurantOwner);
    public record UpdateUserRequest(string FirstName, string LastName, string AddressCityZip, string AddressCity, string AddressStreet, string NewPassword);

}