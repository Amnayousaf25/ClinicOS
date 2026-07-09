import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { useDeleteStaff, useUpdateStaff } from '@/hooks/useApi';
import type { StaffMember } from '@/types';

interface ToggleProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
}

export const ToggleActivationDialog = ({
  open,
  onOpenChange,
  member,
}: ToggleProps) => {
  const updateMutation = useUpdateStaff();
  const confirm = () => {
    if (!member) return;
    updateMutation.mutate(
      { id: member._id, isActive: !member.isActive },
      { onSuccess: () => onOpenChange(false) },
    );
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {member?.isActive ? 'Deactivate account?' : 'Activate account?'}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {member?.isActive
              ? `This will block ${member?.name} from signing in until reactivated.`
              : `This will allow ${member?.name} to sign in again.`}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={confirm}
            className={member?.isActive ? 'bg-destructive hover:bg-destructive/90' : ''}
          >
            {member?.isActive ? 'Deactivate' : 'Activate'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

interface DeleteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: StaffMember | null;
}

export const DeleteStaffDialog = ({
  open,
  onOpenChange,
  member,
}: DeleteProps) => {
  const deleteMutation = useDeleteStaff();
  const confirm = () => {
    if (!member) return;
    deleteMutation.mutate(member._id, {
      onSuccess: () => onOpenChange(false),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Remove Staff Member</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground py-2">
          Are you sure you want to remove{' '}
          <span className="font-semibold text-foreground">{member?.name}</span>?
          Their account will be deactivated and they will lose access.
        </p>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending && (
              <Spinner size="sm" className="mr-2 text-current" />
            )}
            Remove
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
