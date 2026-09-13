using AttendanceSystem.Api.Models;
using Microsoft.EntityFrameworkCore;

namespace AttendanceSystem.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<User> Users { get; set; }

    public DbSet<Attendance> Attendances { get; set; }
}