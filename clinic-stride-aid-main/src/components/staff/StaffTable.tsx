import {
  Mail,
  Shield,
  ShieldCheck,
  ShieldOff,
  MoreHorizontal,
  Pencil,
  Trash2,
  BadgeCheck,
  Clock,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import type { StaffMember } from '@/types';
import { MemberAvatar } from './MemberAvatar';
import { roleLabel } from './types';

interface Props {
  members: StaffMember[];
  hasSearch: boolean;
  isSelf: (member: StaffMember) => boolean;
  onEdit: (member: StaffMember) => void;
  onToggleActivation: (member: StaffMember) => void;
  onDelete: (member: StaffMember) => void;
}

export const StaffTable = ({
  members,
  hasSearch,
  isSelf,
  onEdit,
  onToggleActivation,
  onDelete,
}: Props) => {
  if (members.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-muted-foreground gap-3">
        <Users className="w-10 h-10 opacity-30" />
        <p className="text-sm">
          {hasSearch
            ? 'No staff match your search'
            : 'No staff members yet. Invite someone to get started.'}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Member</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden sm:table-cell">Employee ID</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground hidden md:table-cell">Role</th>
              <th className="text-left px-4 py-3 font-semibold text-muted-foreground">Status</th>
              <th className="w-10 px-2 py-3" />
            </tr>
          </thead>
          <tbody>
            {members.map((member, idx) => (
              <tr
                key={member._id}
                className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <MemberAvatar member={member} idx={idx} />
                    <div>
                      <p className="font-medium text-foreground leading-tight">{member.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {member.email}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell font-mono text-xs whitespace-nowrap">
                  {member.employeeId}
                </td>
                <td className="px-4 py-3 hidden md:table-cell">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full',
                      member.role === 'admin'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-muted text-muted-foreground',
                    )}
                  >
                    {member.role === 'admin' ? <ShieldCheck className="w-3 h-3" /> : <Shield className="w-3 h-3" />}
                    {roleLabel(member.role)}
                  </span>
                </td>
                <td className="px-4 py-3">
                  {member.invitationStatus === 'pending' ? (
                    <Badge variant="outline" className="text-xs gap-1">
                      <Clock className="w-3 h-3" />
                      Pending
                    </Badge>
                  ) : member.isActive ? (
                    <Badge variant="outline" className="text-xs gap-1 border-success/40 text-success">
                      <BadgeCheck className="w-3 h-3" />
                      Active
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs gap-1 border-destructive/40 text-destructive">
                      <ShieldOff className="w-3 h-3" />
                      Inactive
                    </Badge>
                  )}
                </td>
                <td className="px-2 py-3">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="w-8 h-8 rounded-lg">
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-44">
                      <DropdownMenuItem onClick={() => onEdit(member)}>
                        <Pencil className="w-3.5 h-3.5 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {member.invitationStatus === 'accepted' && (
                        <DropdownMenuItem
                          onClick={() => onToggleActivation(member)}
                          disabled={isSelf(member)}
                        >
                          {member.isActive ? (
                            <><ShieldOff className="w-3.5 h-3.5 mr-2" />Deactivate</>
                          ) : (
                            <><ShieldCheck className="w-3.5 h-3.5 mr-2" />Activate</>
                          )}
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        onClick={() => onDelete(member)}
                        disabled={isSelf(member)}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="w-3.5 h-3.5 mr-2" />
                        Remove
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
