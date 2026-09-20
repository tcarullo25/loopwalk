using LoopWalk.Core.Geometry;

namespace LoopWalk.Core.Routing;

public interface IMapboxDirectionsClient
{
    /// <summary>
    /// Requests a walking route visiting <paramref name="coordinates"/> in order. Returns
    /// <see langword="null"/> when Mapbox finds no walkable route (a legitimate outcome for start
    /// points far from any road), and throws <see cref="MapboxException"/> when the call itself fails.
    /// </summary>
    Task<DirectionsResult?> GetWalkingRouteAsync(IReadOnlyList<GeoPoint> coordinates, CancellationToken ct = default);
}
