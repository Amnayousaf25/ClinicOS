import { useProfileImageUrl } from '@/hooks/useApi';
import { cn } from '@/lib/utils';
import { getInitials } from '@/lib/utils';
import type { StaffMember } from '@/types';
import { avatarColors } from './types';

interface Props {
  member: StaffMember;
  idx: number;
}

/**
 * Per-row avatar that lazy-fetches a presigned URL when a profile image
 * is set, falling back to a colored gradient + initial.
 */
export const MemberAvatar = ({ member, idx }: Props) => {
  const { data: imgUrl } = useProfileImageUrl(member.profileImage);
  if (imgUrl) {
    return (
      <img
        src={imgUrl}
        alt={member.name}
        className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
      />
    );
  }
  return (
    <div
      className={cn(
        'w-8 h-8 rounded-full bg-gradient-to-br flex items-center justify-center text-white text-xs font-bold shrink-0',
        avatarColors[idx % avatarColors.length],
      )}
    >
      {getInitials(member.name, '?').charAt(0)}
    </div>
  );
};
