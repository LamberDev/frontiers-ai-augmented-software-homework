using PeerReview.Application.Universities;
using PeerReview.Application.Users.RegisterUser;
using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;

namespace PeerReview.Application.UnitTests.Users.RegisterUser;

public class RegisterUserHandlerTests
{
    private static RegisterUserCommand CreateCommand(
        string? userName = "Ada Lovelace",
        string? universityName = "MIT",
        int numberOfPublications = 3) =>
        new(userName!, universityName!, numberOfPublications);

    [Fact]
    public async Task HandleAsync_WithNewUniversity_CreatesUniversityAndUserAndSavesOnce()
    {
        var directory = new FakeUniversityDirectory(
            Result.Success(new UniversityDirectoryEntry(FrontiersOrganizationId: 42, Name: "MIT", Score: 88.5m)));
        var universityRepository = new FakeUniversityRepository();
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);

        var result = await handler.HandleAsync(CreateCommand(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ada Lovelace", result.Value.UserName);
        Assert.Equal(3, result.Value.NumberOfPublications);
        Assert.Equal(42, result.Value.University.FrontiersOrganizationId);
        Assert.Equal("MIT", result.Value.University.Name);
        Assert.Equal(88.5m, result.Value.University.Score);
        Assert.Single(universityRepository.Added);
        Assert.Single(userRepository.Added);
        Assert.Equal(1, unitOfWork.SaveChangesCallCount);
    }

    [Fact]
    public async Task HandleAsync_WithExistingUniversity_ReusesUniversityAndDoesNotAddASecondOne()
    {
        var existingUniversity = University.Create(42, "MIT", 50m).Value;

        // The directory now reports a different score; the existing snapshot must be kept, not updated.
        var directory = new FakeUniversityDirectory(Result.Success(new UniversityDirectoryEntry(42, "MIT", 95m)));
        var universityRepository = new FakeUniversityRepository([existingUniversity]);
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);

        var result = await handler.HandleAsync(CreateCommand(), CancellationToken.None);

        Assert.True(result.IsSuccess);
        Assert.Equal(existingUniversity.Id, result.Value.University.Id);
        Assert.Equal(50m, result.Value.University.Score);
        Assert.Empty(universityRepository.Added);
        Assert.Equal(1, unitOfWork.SaveChangesCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenDirectoryReturnsNotFound_PropagatesErrorAndSavesNothing()
    {
        var directory = new FakeUniversityDirectory(Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.NotFound));
        var universityRepository = new FakeUniversityRepository();
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);

        var result = await handler.HandleAsync(CreateCommand(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.NotFound, result.Error);
        Assert.Empty(universityRepository.Added);
        Assert.Empty(userRepository.Added);
        Assert.Equal(0, unitOfWork.SaveChangesCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenDirectoryReturnsFailure_PropagatesErrorAndSavesNothing()
    {
        var directory = new FakeUniversityDirectory(Result.Failure<UniversityDirectoryEntry>(UniversityDirectoryErrors.Unavailable));
        var universityRepository = new FakeUniversityRepository();
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);

        var result = await handler.HandleAsync(CreateCommand(), CancellationToken.None);

        Assert.True(result.IsFailure);
        Assert.Equal(UniversityDirectoryErrors.Unavailable, result.Error);
        Assert.Equal(0, unitOfWork.SaveChangesCallCount);
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public async Task HandleAsync_WithBlankUniversityName_ReturnsValidationErrorWithoutCallingDirectory(string? universityName)
    {
        var directory = new FakeUniversityDirectory(Result.Success(new UniversityDirectoryEntry(1, "MIT", 50m)));
        var universityRepository = new FakeUniversityRepository();
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);
        var command = CreateCommand(universityName: universityName);

        var result = await handler.HandleAsync(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == RegisterUserErrors.UniversityNameRequired.Code);
        Assert.Equal(0, directory.CallCount);
        Assert.Equal(0, unitOfWork.SaveChangesCallCount);
    }

    [Fact]
    public async Task HandleAsync_WithInvalidUserName_ReturnsValidationErrorAndSavesNothing()
    {
        var existingUniversity = University.Create(42, "MIT", 50m).Value;
        var directory = new FakeUniversityDirectory(Result.Success(new UniversityDirectoryEntry(42, "MIT", 50m)));
        var universityRepository = new FakeUniversityRepository([existingUniversity]);
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);
        var command = CreateCommand(userName: "");

        var result = await handler.HandleAsync(command, CancellationToken.None);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UserNameRequired.Code);
        Assert.Empty(userRepository.Added);
        Assert.Equal(0, unitOfWork.SaveChangesCallCount);
    }

    [Fact]
    public async Task HandleAsync_WhenDirectoryReturnsInvalidUniversityData_ReturnsValidationErrorAndSavesNothing()
    {
        var directory = new FakeUniversityDirectory(Result.Success(new UniversityDirectoryEntry(42, "", 50m)));
        var universityRepository = new FakeUniversityRepository();
        var userRepository = new FakeUserRepository();
        var unitOfWork = new FakeUnitOfWork();
        var handler = new RegisterUserHandler(directory, universityRepository, userRepository, unitOfWork);

        var result = await handler.HandleAsync(CreateCommand(), CancellationToken.None);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UniversityErrors.NameRequired.Code);
        Assert.Empty(universityRepository.Added);
        Assert.Equal(0, unitOfWork.SaveChangesCallCount);
    }
}
