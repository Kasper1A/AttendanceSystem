import type {
    User,
    Attendance
} from "./types";

const API_URL =
    "http://localhost:5135/api";

export async function getUsers(): Promise<User[]> {
    const response =
        await fetch(`${API_URL}/Users`);

    if (!response.ok) {
        throw new Error(
            "Kunde inte hämta användare."
        );
    }

    return await response.json();
}

export async function getAttendances(): Promise<Attendance[]> {
    const response =
        await fetch(`${API_URL}/Attendance`);

    if (!response.ok) {
        throw new Error(
            "Kunde inte hämta tidsregistreringar."
        );
    }

    return await response.json();
}

export async function checkIn(
    userId: number
): Promise<Attendance> {

    const response =
        await fetch(
            `${API_URL}/Attendance/checkin?userId=${userId}`,
            {
                method: "POST"
            }
        );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(message);
    }

    return await response.json();
}

export async function checkOut(
    attendanceId: number
): Promise<void> {

    const response =
        await fetch(
            `${API_URL}/Attendance/${attendanceId}/checkout`,
            {
                method: "PUT"
            }
        );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(message);
    }
}

export async function updateAttendance(
    id: number,
    checkInTime: string,
    checkOutTime: string | null
): Promise<Attendance> {

    const response =
        await fetch(
            `${API_URL}/Attendance/${id}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type":
                        "application/json"
                },
                body: JSON.stringify({
                    checkIn: checkInTime,
                    checkOut: checkOutTime
                })
            }
        );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(message);
    }

    return await response.json();
}

/*
 * Denna används av admin via frontend om
 * du skulle vilja ha det senare.
 *
 * Just nu är tanken att administratören
 * tar bort registreringar via Swagger.
 */
export async function deleteAttendance(
    attendanceId: number
): Promise<void> {

    const response =
        await fetch(
            `${API_URL}/Attendance/${attendanceId}`,
            {
                method: "DELETE"
            }
        );

    if (!response.ok) {
        const message =
            await response.text();

        throw new Error(message);
    }
}