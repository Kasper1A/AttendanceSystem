namespace AttendanceSystem.Api.Models;

public class Attendance
{
    public int Id { get; set; }

    public DateTime CheckIn { get; set; }

    public DateTime? CheckOut { get; set; }

    public int UserId { get; set; }

    public User User { get; set; } = null!;
}