
export interface User {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'teacher' | 'leader';
}

export interface Resource {
  id: number;
  name: string;
  type: string;
  description?: string;
  active: boolean;
}

export interface Reservation {
  id: number;
  resource_id: number;
  user_id: number;
  responsible_name: string;
  group_or_sector: string;
  reservation_date: string;
  start_time: string;
  end_time: string;
  observation?: string;
  status: 'reserved' | 'cancelled' | 'completed';
  resource_name?: string; // Joined
  resource_type?: string; // Joined
}

export interface Extraclasse {
  id: number;
  user_id: number;
  student_name: string;
  class_name: string;
  requesting_teacher: string;
  activity_date: string;
  time_slots: string; // Comma separated slot IDs
  reason: string;
  observation?: string;
  status: 'pending' | 'approved' | 'rejected' | 'cancelled';
  created_at?: string;
  user_name?: string; // Joined
}

export interface DailyAttendance {
  id: number;
  user_id: number;
  class_name: string;
  student_count: number;
  attendance_date: string;
  created_at?: string;
  responsible_name?: string; // Joined
}
