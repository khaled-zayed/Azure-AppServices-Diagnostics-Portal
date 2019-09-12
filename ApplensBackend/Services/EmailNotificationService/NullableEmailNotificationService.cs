using System.Collections.Generic;
using System.Threading.Tasks;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Services
{
    /// <summary>
    /// Empty email notification service.
    /// </summary>
    public class NullableEmailNotificationService : IEmailNotificationService
    {
        /// <inheritdoc/>
        public Task SendPublishingAlert(string alias, string detectorId, string link, IEnumerable<EmailAddress> tos)
        {
            return Task.FromResult(true);
        }
    }
}
