using System.ComponentModel.DataAnnotations;

namespace LoopWalk.Core.Routing;

public sealed class LoopRouteOptions
{
    public const string SectionName = "LoopRoute";

    /// <summary>How many Mapbox round-trips we'll spend chasing the target distance.</summary>
    [Range(1, 6)]
    public int MaxAttempts { get; set; } = 3;

    /// <summary>Stop correcting once the snapped distance is within this percentage of the target.</summary>
    [Range(1, 50)]
    public double TolerancePercent { get; set; } = 10.0;

    /// <summary>
    /// Fraction of the raw correction to apply per attempt. Applying the full ratio makes the radius
    /// oscillate on dense street grids, so we under-correct deliberately and converge instead.
    /// </summary>
    [Range(0.1, 1.0)]
    public double DampingFactor { get; set; } = 0.7;

    [Range(500, 100_000)]
    public double MinDistanceMeters { get; set; } = 500;

    [Range(500, 100_000)]
    public double MaxDistanceMeters { get; set; } = 42_000;
}
