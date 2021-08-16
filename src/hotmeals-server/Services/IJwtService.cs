using hotmeals_server.Model;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{
    /// <summary>
    /// Provides JWT methods.
    /// </summary>
    public interface IJwtService
    {
        /// <summary>
        /// Gets token validation parameters.
        /// </summary>
        public TokenValidationParameters GetTokenValidationParameters();

        /// <summary>
        /// Generate JWT token.
        /// </summary>
        public JwtTokenInfo GenerateToken(UserRecord user);

        /// <summary>
        /// Generates serialized token.
        /// </summary>
        public string SerializeToken(JwtTokenInfo tokenInfo);

    }

    /// <summary>
    /// Contains generated JWT token information
    /// </summary>
    /// <param name="Token">Token</param>
    /// <param name="ExpiresInSeconds">Number of seconds after which the token expires (starting from CreatedAt)</param>
    /// <returns></returns>
    public record JwtTokenInfo(JwtSecurityToken Token, DateTimeOffset CreatedAt, int ExpiresInSeconds);


    public static class JwtServiceDefaults
    {
        /// <summary>
        /// Authorization role for customer.
        /// </summary>
        public const string RoleCustomer = "Customer";
        /// <summary>
        /// Authorization role for owner.
        /// </summary>
        public const string RoleOwner = "Owner";

        /// <summary>
        /// Number of seconds for how long the JWT token is valid (after which it expires)
        /// </summary>
        public const int JwtTokenExpirationSeconds = 7 * 24 * 60 * 60;
    }
}
