using System;

namespace hotmeals_server.Model {

    public record UserData(Guid Id, string Email);
    public record UserLoginDTO(string Email, string Password);
    public record UserRegistrationDTO(string Email, string FirstName, string LastName, string Password);

}