using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{
    /// <summary>
    /// Provides cryptologial methods.
    /// </summary>
    public class DefaultCryptoService : ICryptoService
    {
        /// <summary>
        /// Generate hash and salt from the given password string.
        /// </summary>
        public (string Hash, string Salt) GenerateSaltedHash(string password)
        {
            // 128 bit salt
            var saltBytes = new byte[128 / 8];
            var provider = new RNGCryptoServiceProvider();
            provider.GetNonZeroBytes(saltBytes);
            var salt = Convert.ToBase64String(saltBytes);

            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 10000);
            var hashPassword = Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256));

            return (hashPassword, salt);
        }

        /// <summary>
        /// Verifies that the provided password matches given hash and salt values
        /// </summary>
        /// <param name="password">Password to check.</param>
        /// <param name="hash">Base64 encoded hash value.</param>
        /// <param name="salt">Base64 encoded salt value.</param>
        public bool VerifyPassword(string password, string hash, string salt) {
            var saltBytes = Convert.FromBase64String(salt);
            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 10000);
            return Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256)) == hash;
        }

    }
}
