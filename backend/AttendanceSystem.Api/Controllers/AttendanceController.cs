using AttendanceSystem.Api.Data;
using AttendanceSystem.Api.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace AttendanceSystem.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AttendanceController : ControllerBase
{
    private readonly AppDbContext _context;

    public AttendanceController(AppDbContext context)
    {
        _context = context;
    }


    // GET: api/Attendance
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Attendance>>> GetAttendances()
    {
        var attendances = await _context.Attendances
            .Include(a => a.User)
            .OrderByDescending(a => a.CheckIn)
            .ToListAsync();

        return Ok(attendances);
    }


    // GET: api/Attendance/5
    [HttpGet("{id}")]
    public async Task<ActionResult<Attendance>> GetAttendance(int id)
    {
        var attendance =
            await _context.Attendances
                .Include(a => a.User)
                .FirstOrDefaultAsync(a => a.Id == id);

        if (attendance == null)
        {
            return NotFound();
        }

        return Ok(attendance);
    }


    // POST: api/Attendance/checkin?userId=1
    [HttpPost("checkin")]
    public async Task<ActionResult<Attendance>> CheckIn(int userId)
    {
        var user =
            await _context.Users.FindAsync(userId);

        if (user == null)
        {
            return NotFound("User not found.");
        }


        // Kontrollera om användaren
        // redan har ett aktivt pass.
        var activeAttendance =
            await _context.Attendances
                .FirstOrDefaultAsync(a =>
                    a.UserId == userId &&
                    a.CheckOut == null);


        if (activeAttendance != null)
        {
            return BadRequest(
                "User is already checked in."
            );
        }


        var attendance = new Attendance
        {
            UserId = userId,
            CheckIn = DateTime.Now,
            CheckOut = null
        };


        _context.Attendances.Add(
            attendance
        );


        await _context.SaveChangesAsync();


        return Ok(attendance);
    }


    // PUT: api/Attendance/5/checkout
    [HttpPut("{id}/checkout")]
    public async Task<IActionResult> CheckOut(int id)
    {
        var attendance =
            await _context.Attendances
                .FirstOrDefaultAsync(a =>
                    a.Id == id);


        if (attendance == null)
        {
            return NotFound(
                "Attendance record not found."
            );
        }


        if (attendance.CheckOut != null)
        {
            return BadRequest(
                "Attendance is already checked out."
            );
        }


        attendance.CheckOut =
            DateTime.Now;


        await _context.SaveChangesAsync();


        return Ok(attendance);
    }


    // PUT: api/Attendance/5
    // Används för att redigera
    // ett tidigare arbetspass.
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateAttendance(
        int id,
        [FromBody] UpdateAttendanceRequest request)
    {
        var attendance =
            await _context.Attendances
                .FirstOrDefaultAsync(a =>
                    a.Id == id);


        if (attendance == null)
        {
            return NotFound(
                "Attendance record not found."
            );
        }


        if (request.CheckIn == default)
        {
            return BadRequest(
                "Check-in time is required."
            );
        }


        if (
            request.CheckOut.HasValue &&
            request.CheckOut.Value < request.CheckIn
        )
        {
            return BadRequest(
                "Check-out cannot be before check-in."
            );
        }


        attendance.CheckIn =
            request.CheckIn;

        attendance.CheckOut =
            request.CheckOut;


        await _context.SaveChangesAsync();


        return Ok(attendance);
    }

    // DELETE: api/Attendance/5
// DELETE: api/Attendance/5
[HttpDelete("{id}")]
public async Task<IActionResult> DeleteAttendance(int id)
{
    var attendance =
        await _context.Attendances
            .FirstOrDefaultAsync(a => a.Id == id);

    if (attendance == null)
    {
        return NotFound("Attendance record not found.");
    }

    _context.Attendances.Remove(attendance);

    await _context.SaveChangesAsync();

    return NoContent();
}
}


// DTO som används när ett
// tidigare arbetspass redigeras.
public class UpdateAttendanceRequest
{
    public DateTime CheckIn { get; set; }

    public DateTime? CheckOut { get; set; }
}