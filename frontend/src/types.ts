export interface User {
    id: number;
    name: string;
    email: string;
}

export interface Attendance {
    id: number;
    checkIn: string;
    checkOut: string | null;
    userId: number;
}