using System;

namespace hotmeals_server.Model {
    public record LoginRequestDTO(string Email, string Password);
    public record UserDTO(string Email, string FirstName, string LastName, bool IsRestaurantOwner);
    public record UserRegistrationDTO(string Email, string FirstName, string LastName, string Password, bool IsRestaurantOwner);

}