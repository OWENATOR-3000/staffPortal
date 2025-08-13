// app/dashboard/payroll/page.tsx
import { getSessionUser } from "@/lib/session";
import { redirect } from "next/navigation";
import Link from 'next/link';
import { Calculator, Coins, History, FileText } from 'lucide-react'; // Import icons

interface FeatureCardProps {
  href: string;
  icon: React.ElementType;
  title: string;
  description: string;
}

// A helper component for the navigation cards
const FeatureCard = ({ href, icon: Icon, title, description }: FeatureCardProps) => (
  <Link href={href} className="block p-6 bg-white rounded-lg shadow-md hover:shadow-xl hover:scale-105 transition-transform duration-200">
    <div className="flex items-center">
      <div className="p-3 bg-blue-100 text-blue-600 rounded-lg">
        <Icon className="h-6 w-6" />
      </div>
      <h3 className="ml-4 text-xl font-bold text-gray-800">{title}</h3>
    </div>
    <p className="mt-2 text-gray-600">
      {description}
    </p>
  </Link>
);


export default async function PayrollHubPage() {
    const session = getSessionUser();
    if (!session) redirect('/login');
    
    // In a real app, you would check permissions for each card
    // const canCalculate = await userHasPermission(session.userId, 'manage_payroll_settings');
    // const canManageCommissions = await userHasPermission(session.userId, 'manage_commissions');
    
    return (
        <>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-800">Payroll Management</h1>
                <p className="text-gray-600">Access all payroll-related tools and reports.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Payroll Calculator Card */}
                <FeatureCard 
                    href="/dashboard/payroll-calculator" // Points to the old page's new location
                    icon={Calculator}
                    title="Payroll Calculator"
                    description="Calculate staff pay based on hours worked and hourly rates."
                />

                {/* Commissions Card (Placeholder) */}
                <FeatureCard 
                    href="/dashboard/commissions" // Future page
                    icon={Coins}
                    title="Commissions"
                    description="Manage and assign sales commissions for staff members."
                />

                {/* Payroll History/Filter Card (Placeholder) */}
                <FeatureCard 
                    href="/dashboard/payroll/reports" // Future page
                    icon={History}
                    title="Payroll Reports"
                    description="View, filter, and export historical payroll data."
                />
                
                {/* Generate Payslips Card (Placeholder) */}
                <FeatureCard 
                    href="/dashboard/payroll/payslips" // Future page
                    icon={FileText}
                    title="Generate Payslips"
                    description="Create and distribute payslips for a given pay period."
                />
            </div>
        </>
    );
}