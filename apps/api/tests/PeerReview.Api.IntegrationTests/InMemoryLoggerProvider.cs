using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;

namespace PeerReview.Api.IntegrationTests;

/// <summary>
/// One captured log entry, enough to assert on level, category and the logged exception without
/// depending on message formatting.
/// </summary>
public sealed record CapturedLogEntry(LogLevel LogLevel, string Category, string Message, Exception? Exception);

/// <summary>
/// A minimal <see cref="ILoggerProvider"/> that records every log entry in memory, so a test can
/// assert on what the host actually logged (e.g. no Error-level entry for a client body error)
/// instead of only on the HTTP response.
/// </summary>
public sealed class InMemoryLoggerProvider : ILoggerProvider
{
    public ConcurrentQueue<CapturedLogEntry> Entries { get; } = new();

    public ILogger CreateLogger(string categoryName) => new CapturingLogger(categoryName, Entries);

    public void Dispose()
    {
    }

    private sealed class CapturingLogger(string category, ConcurrentQueue<CapturedLogEntry> entries) : ILogger
    {
        public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter) =>
            entries.Enqueue(new CapturedLogEntry(logLevel, category, formatter(state, exception), exception));
    }
}
