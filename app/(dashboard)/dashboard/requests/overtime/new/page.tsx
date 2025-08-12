// app/dashboard/requests/overtime/new/page.tsx
import OvertimeRequestForm from "@/components/dashboard/OvertimeRequestForm";
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function NewOvertimeRequestPage() {
    const session = getSessionUser();
    if (!session) redirect('/login');
    
    return (
        <>
             <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Overtime Request Form</h1>
                <p className="text-gray-600">Complete the form below to request payment for overtime hours.</p>
            </div>
            
            <div className="bg-white p-8 rounded-lg shadow-md max-w-2xl mx-auto">
                <OvertimeRequestForm />
            </div>
        </>
    );
}