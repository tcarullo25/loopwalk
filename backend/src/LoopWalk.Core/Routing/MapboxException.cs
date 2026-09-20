namespace LoopWalk.Core.Routing;

/// <summary>Mapbox was unreachable or answered with something we can't use. Surfaces as a 502.</summary>
public sealed class MapboxException : Exception
{
    public MapboxException(string message, Exception? innerException = null)
        : base(message, innerException) { }
}
