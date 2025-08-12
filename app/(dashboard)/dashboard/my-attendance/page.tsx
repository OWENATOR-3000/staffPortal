// app/dashboard/my-attendance/page.tsx
import MyAttendanceViewer from "@/components/dashboard/MyAttendanceViewer";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function MyAttendancePage() {
    // Call the synchronous function
    const session = await getSessionUser();

    // Check if the result is null
    if (!session) {
        redirect('/login');
    }

    // If we're past the check, TypeScript knows session is not null
    // and session.userId is safe to access.
    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">My Attendance History</h1>
                <p className="text-gray-600">Review your personal clock-in and clock-out records.</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow-md">
                <MyAttendanceViewer staffId={session.userId} />
            </div>
        </>
    );
}