namespace LoopWalk.Core.Routing;

public interface ILoopRouteGenerator
{
    /// <exception cref="NoRouteFoundException">No walkable loop could be found near the start.</exception>
    /// <exception cref="MapboxException">The Directions API could not be reached or understood.</exception>
    Task<LoopRoute> GenerateAsync(LoopRouteRequest request, CancellationToken ct = default);
}
