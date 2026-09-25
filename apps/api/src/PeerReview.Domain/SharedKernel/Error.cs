namespace PeerReview.Domain.SharedKernel;

public record Error(string Code, string Message, ErrorType Type);
