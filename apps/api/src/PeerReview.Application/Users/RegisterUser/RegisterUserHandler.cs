using PeerReview.Application.Abstractions.Persistence;
using PeerReview.Application.Universities;
using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;
using DomainUser = PeerReview.Domain.Users.User;

namespace PeerReview.Application.Users.RegisterUser;

public sealed class RegisterUserHandler
{
    private readonly IUniversityDirectory _universityDirectory;
    private readonly IUniversityRepository _universityRepository;
    private readonly IUserRepository _userRepository;
    private readonly IUnitOfWork _unitOfWork;

    public RegisterUserHandler(
        IUniversityDirectory universityDirectory,
        IUniversityRepository universityRepository,
        IUserRepository userRepository,
        IUnitOfWork unitOfWork)
    {
        _universityDirectory = universityDirectory;
        _universityRepository = universityRepository;
        _userRepository = userRepository;
        _unitOfWork = unitOfWork;
    }

    public async Task<Result<RegisteredUser>> HandleAsync(RegisterUserCommand command, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(command.UniversityName))
        {
            return Result.Failure<RegisteredUser>(new ValidationError([RegisterUserErrors.UniversityNameRequired]));
        }

        var directoryResult = await _universityDirectory.FindByNameAsync(command.UniversityName, cancellationToken);

        if (directoryResult.IsFailure)
        {
            return Result.Failure<RegisteredUser>(directoryResult.Error!);
        }

        var directoryEntry = directoryResult.Value;

        var existingUniversity = await _universityRepository.GetByFrontiersOrganizationIdAsync(
            directoryEntry.FrontiersOrganizationId,
            cancellationToken);

        var isNewUniversity = existingUniversity is null;
        University university;

        if (existingUniversity is null)
        {
            // A new university is only staged together with a valid user: build and validate it
            // here, but do not add it to the repository until the user also validates below.
            var universityResult = University.Create(
                directoryEntry.FrontiersOrganizationId,
                directoryEntry.Name,
                directoryEntry.Score);

            if (universityResult.IsFailure)
            {
                // Invalid directory data (e.g. an empty name) is an upstream failure of the
                // directory, not a client validation error.
                return Result.Failure<RegisteredUser>(UniversityDirectoryErrors.InvalidEntry);
            }

            university = universityResult.Value;
        }
        else
        {
            university = existingUniversity;
        }

        var userResult = DomainUser.Create(command.UserName, command.NumberOfPublications, university);

        if (userResult.IsFailure)
        {
            return Result.Failure<RegisteredUser>(userResult.Error!);
        }

        var user = userResult.Value;

        if (isNewUniversity)
        {
            await _universityRepository.AddAsync(university, cancellationToken);
        }

        await _userRepository.AddAsync(user, cancellationToken);

        await _unitOfWork.SaveChangesAsync(cancellationToken);

        return Result.Success(new RegisteredUser(
            user.Id,
            user.UserName,
            user.NumberOfPublications,
            new RegisteredUserUniversity(university.Id, university.FrontiersOrganizationId, university.Name, university.Score)));
    }
}
