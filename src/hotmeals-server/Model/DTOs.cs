using System;
using System.ComponentModel.DataAnnotations;

namespace hotmeals_server.Model
{
    public record LoginRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(500)] string Password);
    public record UserResponse([Required][MaxLength(100)] string Email, [Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, bool IsRestaurantOwner);
    public record RegisterUserRequest([Required][MaxLength(100)] string Email, [Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [Required][MaxLength(500)] string Password, bool IsRestaurantOwner);
    public record UpdateUserRequest([Required][MaxLength(100)] string FirstName, [Required][MaxLength(100)] string LastName, [Required][MaxLength(20)] string AddressCityZip, [Required][MaxLength(100)] string AddressCity, [Required][MaxLength(200)] string AddressStreet, [Required][MaxLength(500)] string NewPassword);

}