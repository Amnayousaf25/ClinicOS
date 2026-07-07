import { useEffect, useState } from 'react';
import { useFormik } from 'formik';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/Spinner';
import { InitialsAvatar } from '@/components/InitialsAvatar';
import { Pencil, FileText } from 'lucide-react';
import dayjs from 'dayjs';
import { toast } from 'sonner';
import {
  fetchIntakeSubmission,
  updateIntakeSubmission,
  writeAppointmentIntakeCache,
  writeIntakeSubmissionCache,
} from '@/lib/intakeApi';
import { intakeSchema } from '@/lib/intakeValidation';
import {
  IntakeFormEditFields,
  type IntakeEditValues,
} from './IntakeFormEditFields';
import { IntakeFormReadView } from './IntakeFormReadView';

export interface IntakeRowSummary {
  id: string;
  appointmentId: string;
  patientName: string;
  patientEmail: string;
  patientPhone: string;
  service: string;
  date: string;
  time: string;
}

interface Props {
  selected: IntakeRowSummary | null;
  onClose: () => void;
  onUpdated: (next: IntakeRowSummary) => void;
}

export const IntakeFormDetailDialog = ({
  selected,
  onClose,
  onUpdated,
}: Props) => {
  const qc = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);

  const { data: submission, isLoading: submissionLoading } = useQuery({
    queryKey: ['intake-submission', selected?.appointmentId],
    queryFn: () => fetchIntakeSubmission(selected!.appointmentId),
    enabled: !!selected?.appointmentId,
  });

  const updateMutation = useMutation({
    mutationFn: (payload: IntakeEditValues) =>
      updateIntakeSubmission(selected!.appointmentId, payload),
    onSuccess: (updated) => {
      writeIntakeSubmissionCache(qc, updated);
      writeAppointmentIntakeCache(qc, updated);
      qc.invalidateQueries({ queryKey: ['appointments'] });
      if (selected && selected.appointmentId === updated.appointmentId) {
        onUpdated({
          ...selected,
          patientName: updated.name,
          patientEmail: updated.email,
          patientPhone: updated.phone,
        });
      }
      toast.success('Patient data updated');
      setIsEditing(false);
    },
    onError: () => toast.error('Failed to update intake form'),
  });

  const formik = useFormik<IntakeEditValues>({
    enableReinitialize: true,
    initialValues: {
      name: submission?.name || '',
      dob: submission?.dob || '',
      phone: submission?.phone || '',
      email: submission?.email || '',
      reasonForVisit: submission?.reasonForVisit || '',
      consent: submission?.consent || false,
      insuranceProvider: submission?.insuranceProvider || '',
    },
    validationSchema: intakeSchema,
    onSubmit: (values) => updateMutation.mutate(values),
  });

  useEffect(() => {
    if (!selected) setIsEditing(false);
  }, [selected]);

  return (
    <Dialog
      open={!!selected}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="sm:max-w-lg rounded-2xl p-0 max-h-[90vh] overflow-hidden">
        <DialogHeader className="px-6 py-4 pr-12 border-b border-border/60">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <DialogTitle className="text-lg font-bold">
              Intake Form Details
            </DialogTitle>
            {submission && !isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => setIsEditing(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
          </div>
          <DialogDescription className="sr-only">
            Patient intake form — view or edit submitted details.
          </DialogDescription>
        </DialogHeader>
        {selected && (
          <div className="flex flex-col max-h-[calc(90vh-74px)]">
            <form
              onSubmit={formik.handleSubmit}
              className="flex flex-col flex-1 min-h-0"
            >
              <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-muted/60">
                  <InitialsAvatar
                    name={selected.patientName}
                    size="lg"
                    gradient="from-secondary to-primary"
                    textColor="text-primary-foreground"
                    className="shadow-3d"
                  />
                  <div>
                    <p className="text-lg font-bold text-foreground">
                      {selected.patientName}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selected.service} on{' '}
                      {dayjs(selected.date).format('MMM D, YYYY')} at{' '}
                      {selected.time}
                    </p>
                  </div>
                </div>

                {submissionLoading ? (
                  <div className="flex items-center justify-center py-10">
                    <Spinner size="md" />
                  </div>
                ) : !submission ? (
                  <p className="text-sm text-muted-foreground">
                    Unable to load the submitted intake form.
                  </p>
                ) : isEditing ? (
                  <IntakeFormEditFields formik={formik} />
                ) : (
                  <IntakeFormReadView submission={submission} />
                )}

                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <FileText className="w-3.5 h-3.5" /> Service
                  </div>
                  <div className="p-3 rounded-xl bg-muted/60">
                    <p className="text-sm text-foreground">{selected.service}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl border border-border">
                  <span className="text-sm text-foreground font-medium">
                    Intake Status
                  </span>
                  <span className="inline-flex items-center gap-1 text-xs font-semibold px-3 py-1 rounded-full bg-success/15 text-success">
                    Confirmed
                  </span>
                </div>
              </div>

              {isEditing && submission && (
                <div className="shrink-0 px-6 py-4 border-t border-border/60 bg-background">
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setIsEditing(false);
                        formik.resetForm();
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="rounded-xl"
                      disabled={updateMutation.isPending}
                    >
                      {updateMutation.isPending ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </div>
                </div>
              )}
            </form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
