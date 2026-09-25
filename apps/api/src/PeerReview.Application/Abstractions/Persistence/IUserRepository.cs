using PeerReview.Domain.Users;

namespace PeerReview.Application.Abstractions.Persistence;

public interface IUserRepository : IRepository<User, Guid>
{
}
