import { useMemo, useState } from 'react';
import { PageSpinner } from '@/components/Spinner';
import { useStaff } from '@/hooks/useApi';
import { useAuth } from '@/hooks/useAuth';
import type { StaffMember } from '@/types';
import { Users, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { PageHeader } from '@/components/PageHeader';
import { SearchInput } from '@/components/SearchInput';
import { StaffStatusFilter } from '@/components/staff/StaffStatusFilter';
import { StaffTable } from '@/components/staff/StaffTable';
import { StaffFormDialog } from '@/components/staff/StaffFormDialog';
import {
  DeleteStaffDialog,
  ToggleActivationDialog,
} from '@/components/staff/StaffConfirmDialogs';
import type { FormMode, StatusFilter } from '@/components/staff/types';

const StaffPage = () => {
  const { data: staff = [], isLoading } = useStaff();
  const { userId } = useAuth();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('invite');
  const [selected, setSelected] = useState<StaffMember | null>(null);
  const [toggleOpen, setToggleOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const isSelf = (member: StaffMember) => member._id === userId;

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return staff
      .filter((s) => {
        if (statusFilter === 'active') return s.isActive;
        if (statusFilter === 'inactive') return !s.isActive;
        return true;
      })
      .filter(
        (s) =>
          !q ||
          s.name.toLowerCase().includes(q) ||
          s.email.toLowerCase().includes(q) ||
          s.employeeId.toLowerCase().includes(q),
      );
  }, [staff, statusFilter, search]);

  const inactiveCount = useMemo(
    () => staff.filter((s) => !s.isActive).length,
    [staff],
  );

  const openInvite = () => {
    setFormMode('invite');
    setSelected(null);
    setFormOpen(true);
  };

  const openEdit = (member: StaffMember) => {
    setFormMode('edit');
    setSelected(member);
    setFormOpen(true);
  };

  const openToggle = (member: StaffMember) => {
    if (isSelf(member)) {
      toast.error('You cannot deactivate your own account');
      return;
    }
    setSelected(member);
    setToggleOpen(true);
  };

  const openDelete = (member: StaffMember) => {
    if (isSelf(member)) {
      toast.error('You cannot remove your own account');
      return;
    }
    setSelected(member);
    setDeleteOpen(true);
  };

  if (isLoading) return <PageSpinner />;

  return (
    <div className="animate-fade-in space-y-6">
      <PageHeader
        icon={Users}
        title="Staff"
        subtitle={`${staff.length} member${staff.length !== 1 ? 's' : ''}`}
        actions={
          <>
            <StaffStatusFilter
              value={statusFilter}
              onChange={setStatusFilter}
              total={staff.length}
              active={staff.length - inactiveCount}
              inactive={inactiveCount}
            />
            <SearchInput
              value={search}
              onChange={setSearch}
              placeholder="Search by name, email, ID…"
            />
            <Button size="sm" className="rounded-xl" onClick={openInvite}>
              <UserPlus className="w-4 h-4 mr-1.5" />
              Invite Staff
            </Button>
          </>
        }
      />

      <StaffTable
        members={filtered}
        hasSearch={!!search}
        isSelf={isSelf}
        onEdit={openEdit}
        onToggleActivation={openToggle}
        onDelete={openDelete}
      />

      <StaffFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        member={selected}
      />
      <ToggleActivationDialog
        open={toggleOpen}
        onOpenChange={setToggleOpen}
        member={selected}
      />
      <DeleteStaffDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        member={selected}
      />
    </div>
  );
};

export default StaffPage;
