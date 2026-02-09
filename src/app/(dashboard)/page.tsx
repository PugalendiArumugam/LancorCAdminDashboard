import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Building2, Package } from "lucide-react";

export default function DashboardHome() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">LancorC Admin Overview</h1>
        <p className="text-slate-500">Welcome to your apartment management portal.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Society Users</CardTitle>
            <Users className="h-4 w-4 text-slate-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">Manage residents and staff</div>
          </CardContent>
        </Card>
        {/* You can add similar cards for Flats and Assets here later */}
      </div>
    </div>
  );
}
