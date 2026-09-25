using PeerReview.Domain.SharedKernel;
using PeerReview.Domain.Universities;
using PeerReview.Domain.Users;

namespace PeerReview.Domain.UnitTests.Users;

public class UserTests
{
    private static University CreateUniversity() =>
        University.Create(frontiersOrganizationId: 1, name: "MIT", score: 75m).Value;

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Create_WithMissingUserName_ReturnsUserNameRequiredError(string? userName)
    {
        var university = CreateUniversity();

        var result = User.Create(userName: userName, numberOfPublications: 0, university: university);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UserNameRequired.Code);
    }

    [Fact]
    public void Create_WithSurroundingSpacesInUserName_IsTrimmed()
    {
        var university = CreateUniversity();

        var result = User.Create(userName: "  Ada Lovelace  ", numberOfPublications: 0, university: university);

        Assert.True(result.IsSuccess);
        Assert.Equal("Ada Lovelace", result.Value.UserName);
    }

    [Fact]
    public void Create_WithUserNameExactlyAtMaxLength_IsAllowed()
    {
        var university = CreateUniversity();
        var userName = new string('a', User.UserNameMaxLength);

        var result = User.Create(userName: userName, numberOfPublications: 0, university: university);

        Assert.True(result.IsSuccess);
        Assert.Equal(User.UserNameMaxLength, result.Value.UserName.Length);
    }

    [Fact]
    public void Create_WithUserNameOverMaxLength_ReturnsUserNameTooLongError()
    {
        var university = CreateUniversity();
        var userName = new string('a', User.UserNameMaxLength + 1);

        var result = User.Create(userName: userName, numberOfPublications: 0, university: university);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UserNameTooLong.Code);
    }

    [Fact]
    public void Create_WithMaxLengthUserNameSurroundedByWhitespace_IsTrimmedAndAllowed()
    {
        var university = CreateUniversity();
        var userName = " " + new string('a', User.UserNameMaxLength) + " ";

        var result = User.Create(userName: userName, numberOfPublications: 0, university: university);

        Assert.True(result.IsSuccess);
        Assert.Equal(User.UserNameMaxLength, result.Value.UserName.Length);
    }

    [Fact]
    public void Create_WithNegativeNumberOfPublications_ReturnsNegativeNumberOfPublicationsError()
    {
        var university = CreateUniversity();

        var result = User.Create(userName: "Ada", numberOfPublications: -1, university: university);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.NegativeNumberOfPublications.Code);
    }

    [Fact]
    public void Create_WithZeroPublications_IsAllowed()
    {
        var university = CreateUniversity();

        var result = User.Create(userName: "Ada", numberOfPublications: 0, university: university);

        Assert.True(result.IsSuccess);
        Assert.Equal(0, result.Value.NumberOfPublications);
    }

    [Fact]
    public void Create_WithNullUniversity_ReturnsUniversityRequiredError()
    {
        var result = User.Create(userName: "Ada", numberOfPublications: 0, university: null);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UniversityRequired.Code);
    }

    [Fact]
    public void Create_WithMultipleInvalidInputs_AccumulatesAllErrors()
    {
        var result = User.Create(userName: "", numberOfPublications: -1, university: null);

        Assert.True(result.IsFailure);
        var validationError = Assert.IsType<ValidationError>(result.Error);
        Assert.Equal(3, validationError.Errors.Count);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UserNameRequired.Code);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.NegativeNumberOfPublications.Code);
        Assert.Contains(validationError.Errors, error => error.Code == UserErrors.UniversityRequired.Code);
    }

    [Fact]
    public void Create_SetsUniversityIdFromUniversityAndKeepsNavigation()
    {
        var university = CreateUniversity();

        var result = User.Create(userName: "Ada", numberOfPublications: 0, university: university);

        Assert.True(result.IsSuccess);
        Assert.Equal(university.Id, result.Value.UniversityId);
        Assert.Same(university, result.Value.University);
    }

    [Fact]
    public void Create_ReturnsDistinctVersion7IdsPerCall()
    {
        var university = CreateUniversity();

        var first = User.Create(userName: "Ada", numberOfPublications: 0, university: university);
        var second = User.Create(userName: "Grace", numberOfPublications: 0, university: university);

        Assert.Equal(7, first.Value.Id.Version);
        Assert.Equal(7, second.Value.Id.Version);
        Assert.NotEqual(first.Value.Id, second.Value.Id);
    }

    [Fact]
    public void Equals_UsersWithSameValuesButDifferentIds_AreNotEqual()
    {
        var university = CreateUniversity();

        var first = User.Create(userName: "Ada", numberOfPublications: 0, university: university).Value;
        var second = User.Create(userName: "Ada", numberOfPublications: 0, university: university).Value;

        Assert.False(first.Equals(second));
    }

    [Fact]
    public void Equals_SameInstance_AreEqual()
    {
        var university = CreateUniversity();
        var user = User.Create(userName: "Ada", numberOfPublications: 0, university: university).Value;

        Assert.True(user.Equals(user));
    }
}
