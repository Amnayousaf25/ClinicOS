export interface StaffMember {
  _id: string;
  name: string;
  email: string;
  employeeId: string;
  role: 'admin' | 'staff';
  isActive: boolean;
  invitationStatus: 'pending' | 'accepted';
  profileImage?: string;
}

export interface InviteStaffPayload {
  name: string;
  email: string;
  employeeId: string;
  role: 'admin' | 'staff';
  profileImage?: string;
}
