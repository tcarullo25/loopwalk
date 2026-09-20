using LoopWalk.Core.Geometry;
using LoopWalk.Core.Routing;

namespace LoopWalk.Tests.Routing;

/// <summary>
/// Stands in for Mapbox. Measures the straight-line perimeter of the requested coordinates and
/// inflates it by a factor, which is what road snapping does in real life.
/// </summary>
internal sealed class FakeDirectionsClient : IMapboxDirectionsClient
{
    private readonly RouteGeometryService _geometry = new();
    private readonly Func<int, double?> _inflationByAttempt;

    public List<IReadOnlyList<GeoPoint>> Requests { get; } = [];

    public int CallCount => Requests.Count;

    /// <param name="inflationByAttempt">
    /// Given the 1-based attempt number, returns the road-inflation multiplier, or null to
    /// simulate "no walkable route".
    /// </param>
    public FakeDirectionsClient(Func<int, double?> inflationByAttempt)
        => _inflationByAttempt = inflationByAttempt;

    public static FakeDirectionsClient WithConstantInflation(double factor)
        => new(_ => factor);

    public Task<DirectionsResult?> GetWalkingRouteAsync(
        IReadOnlyList<GeoPoint> coordinates,
        CancellationToken ct = default)
    {
        Requests.Add(coordinates);

        var inflation = _inflationByAttempt(Requests.Count);
        if (inflation is null)
            return Task.FromResult<DirectionsResult?>(null);

        var perimeter = 0.0;
        for (var i = 1; i < coordinates.Count; i++)
            perimeter += _geometry.DistanceMeters(coordinates[i - 1], coordinates[i]);

        var distance = perimeter * inflation.Value;

        // 1.4 m/s is a typical walking pace.
        return Task.FromResult<DirectionsResult?>(
            new DirectionsResult(distance, distance / 1.4, coordinates));
    }
}
