using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace hotmeals_server.Services
{
    /// <summary>
    /// Provides cryptologial methods.
    /// </summary>
    public interface ICryptoService
    {
        /// <summary>
        /// Generate hash and salt from the given password string.
        /// </summary>
        public (string Hash, string Salt) GenerateSaltedHash(string password);

        /// <summary>
        /// Verifies that the provided password matches given hash and salt values
        /// </summary>
        /// <param name="enteredPassword">Password to check.</param>
        /// <param name="storedHash">Base64 encoded hash value.</param>
        /// <param name="storedSalt">Base64 encoded salt value.</param>
        public bool VerifyPassword(string password, string hash, string salt);

    }

}
