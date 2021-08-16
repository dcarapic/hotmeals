using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Cryptography;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{
    /// <summary>
    /// Default implementation of ICryptoService
    /// </summary>
    public class DefaultCryptoService : ICryptoService
    {
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

        public bool VerifyPassword(string password, string hash, string salt) {
            var saltBytes = Convert.FromBase64String(salt);
            var rfc2898DeriveBytes = new Rfc2898DeriveBytes(password, saltBytes, 10000);
            return Convert.ToBase64String(rfc2898DeriveBytes.GetBytes(256)) == hash;
        }

    }
}
