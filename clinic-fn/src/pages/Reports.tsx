import { useAppointments } from '@/hooks/useApi';
import { PageSpinner } from '@/components/Spinner';
import { PageHeader } from '@/components/PageHeader';
import { statusBgColor } from '@/lib/appointmentStatus';
import { serviceName } from '@/lib/appointmentDisplay';
import { BarChart3, TrendingUp, PieChart} from 'lucide-react';

const Reports = () => {
  const { data: appointments = [], isLoading } = useAppointments();
  const realAppointments = appointments.filter(a => serviceName(a) !== 'Registration');

  const statusCounts: Record<string, number> = {};
  realAppointments.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

  const serviceCounts: Record<string, number> = {};
  realAppointments.forEach((a) => {
    const service = serviceName(a);
    serviceCounts[service] = (serviceCounts[service] || 0) + 1;
  });

  const intakeCompleted = realAppointments.filter(a => a.intakeStatus === 'confirmed' || a.intakeStatus === 'submitted').length;

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={BarChart3}
        title="Reports"
        subtitle="Analytics & insights"
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-6 text-primary-foreground card-3d">
          <TrendingUp className="w-6 h-6 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{realAppointments.length}</p>
          <p className="text-sm opacity-80">Total Appointments</p>
        </div>
        <div className="bg-gradient-to-br from-secondary to-secondary/80 rounded-2xl p-6 text-secondary-foreground card-3d">
          <PieChart className="w-6 h-6 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{intakeCompleted}</p>
          <p className="text-sm opacity-80">Forms Submitted</p>
        </div>
        <div className="bg-gradient-to-br from-accent to-accent/80 rounded-2xl p-6 text-accent-foreground card-3d">
          <BarChart3 className="w-6 h-6 mb-3 opacity-80" />
          <p className="text-3xl font-bold">{Object.keys(serviceCounts).length}</p>
          <p className="text-sm opacity-80">Active Services</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="bg-card rounded-2xl p-6 card-3d border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Appointment Status</h3>
          <div className="space-y-3">
            {Object.entries(statusCounts).map(([status, count]) => (
              <div key={status} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${statusBgColor[status as keyof typeof statusBgColor] || 'bg-muted'}`} />
                  <span className="text-sm text-muted-foreground capitalize">{status}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${statusBgColor[status as keyof typeof statusBgColor] || 'bg-primary'}`} style={{ width: `${(count / realAppointments.length) * 100}%` }} />
                  </div>
                  <span className="text-sm font-semibold text-foreground w-6 text-right">{count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-card rounded-2xl p-6 card-3d border border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Services Breakdown</h3>
          <div className="space-y-3">
            {Object.entries(serviceCounts).map(([service, count], i) => {
              const colors = ['bg-primary', 'bg-secondary', 'bg-accent', 'bg-warning', 'bg-success'];
              return (
                <div key={service} className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">{service}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-28 h-2.5 bg-muted rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${colors[i % colors.length]}`} style={{ width: `${(count / realAppointments.length) * 100}%` }} />
                    </div>
                    <span className="text-sm font-semibold text-foreground w-6 text-right">{count}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
