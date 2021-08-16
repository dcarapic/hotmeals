using hotmeals_server.Model;
using Microsoft.IdentityModel.Tokens;
using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{
    /// <summary>
    /// Provides cryptologial methods.
    /// </summary>
    public class DefaultJwtService : IJwtService
    {
        private readonly string jwtKey;
        private readonly string jwtIssuer;
        private readonly string jwtAudience;
        private readonly int tokenExpirationSeconds;
        private readonly string roleOwner;
        private readonly string roleCustomer;

        public DefaultJwtService(string jwtKey, string jwtIssuer, string jwtAudience, int tokenExpirationSeconds, string roleOwner, string roleCustomer)
        {
            this.jwtKey = jwtKey;
            this.jwtIssuer = jwtIssuer;
            this.jwtAudience = jwtAudience;
            this.tokenExpirationSeconds = tokenExpirationSeconds;
            this.roleOwner = roleOwner;
            this.roleCustomer = roleCustomer;
        }

        public JwtTokenInfo GenerateToken(UserRecord user)
        {
            var claims = new Claim[] {
                new Claim(ClaimTypes.NameIdentifier, user.Email),
                new Claim(nameof(UserRecord.Id), user.Id.ToString()),
                new Claim(nameof(UserRecord.Email), user.Email),
                new Claim(ClaimTypes.Role, user.IsRestaurantOwner ? roleOwner : roleCustomer),
                new Claim(JwtRegisteredClaimNames.Sub, user.Email),
                new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()) // guarantees uniqueness
            };
            var key = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey));
            var now = DateTimeOffset.UtcNow;
            var expiresAt = now.AddSeconds(tokenExpirationSeconds);

            var token = new JwtSecurityToken(
                issuer: jwtIssuer,
                audience: jwtAudience,
                expires: expiresAt.UtcDateTime,
                claims: claims,
                signingCredentials: new SigningCredentials(key, SecurityAlgorithms.HmacSha256)
            );
            return new JwtTokenInfo(Token: token, CreatedAt: now, ExpiresInSeconds: tokenExpirationSeconds);
        }

        public TokenValidationParameters GetTokenValidationParameters()
        {
            return new TokenValidationParameters()
            {
                ValidateIssuer = true,
                ValidIssuer = jwtIssuer,
                ValidateAudience = true,
                ValidAudience = jwtAudience,
                ValidateIssuerSigningKey = true,
                IssuerSigningKey = new SymmetricSecurityKey(System.Text.Encoding.UTF8.GetBytes(jwtKey))
            };
        }

        public string SerializeToken(JwtTokenInfo tokenInfo)
        {
            return new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler().WriteToken(tokenInfo.Token);
        }
    }
}
