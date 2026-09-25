using PeerReview.Domain.SharedKernel;

namespace PeerReview.Domain.UnitTests.SharedKernel;

public class ResultTests
{
    private static readonly Error SampleError = new("Sample.Error", "Something went wrong.", ErrorType.Failure);

    [Fact]
    public void Success_ReturnsResultWithoutError()
    {
        var result = Result.Success();

        Assert.True(result.IsSuccess);
        Assert.False(result.IsFailure);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_ReturnsResultWithError()
    {
        var result = Result.Failure(SampleError);

        Assert.False(result.IsSuccess);
        Assert.True(result.IsFailure);
        Assert.Equal(SampleError, result.Error);
    }

    [Fact]
    public void GenericSuccess_ReturnsResultWithValue()
    {
        var result = Result.Success(42);

        Assert.True(result.IsSuccess);
        Assert.Equal(42, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void GenericFailure_ReturnsResultWithError()
    {
        var result = Result.Failure<int>(SampleError);

        Assert.True(result.IsFailure);
        Assert.Equal(SampleError, result.Error);
    }

    [Fact]
    public void GenericFailure_AccessingValue_Throws()
    {
        var result = Result.Failure<int>(SampleError);

        Assert.Throws<InvalidOperationException>(() => result.Value);
    }

    [Fact]
    public void FailureWithNullError_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => Result.Failure<int>(null!));
    }

    [Fact]
    public void SuccessWithError_Throws()
    {
        Assert.Throws<InvalidOperationException>(() => new TestResult(true, SampleError));
    }

    // Exposes the protected Result constructor so the "a successful result cannot carry an
    // error" guard can be exercised directly; Result itself has no public API that reaches it,
    // since Success()/Success<T>() never pass an error.
    private sealed class TestResult : Result
    {
        public TestResult(bool isSuccess, Error? error)
            : base(isSuccess, error)
        {
        }
    }
}
