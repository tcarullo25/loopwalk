using LoopWalk.Core.Routing;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddOpenApi();
builder.Services.AddLoopWalkCore(builder.Configuration);

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}
else
{
    // In dev the Vite proxy talks plain http; redirecting would break it.
    app.UseHttpsRedirection();
}

app.UseAuthorization();
app.MapControllers();

app.Run();
