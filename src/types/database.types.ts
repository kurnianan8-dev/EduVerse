export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string;
          avatar_url: string | null;
          role: 'guru' | 'siswa' | 'teacher' | 'student';
          phone_number: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name: string;
          avatar_url?: string | null;
          role?: 'guru' | 'siswa' | 'teacher' | 'student';
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string;
          avatar_url?: string | null;
          role?: 'guru' | 'siswa' | 'teacher' | 'student';
          phone_number?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      schools: {
        Row: {
          id: string;
          name: string;
          code: string;
          domain: string | null;
          logo_url: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          code: string;
          domain?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          code?: string;
          domain?: string | null;
          logo_url?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      school_members: {
        Row: {
          id: string;
          school_id: string;
          user_id: string;
          role: 'school_admin' | 'teacher' | 'student' | 'parent';
          joined_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          user_id: string;
          role: 'school_admin' | 'teacher' | 'student' | 'parent';
          joined_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          user_id?: string;
          role?: 'school_admin' | 'teacher' | 'student' | 'parent';
          joined_at?: string;
        };
      };
      courses: {
        Row: {
          id: string;
          school_id: string;
          teacher_id: string;
          title: string;
          code: string;
          description: string | null;
          is_published: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          teacher_id: string;
          title: string;
          code: string;
          description?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          teacher_id?: string;
          title?: string;
          code?: string;
          description?: string | null;
          is_published?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      classes: {
        Row: {
          id: string;
          school_id: string;
          course_id: string;
          name: string;
          academic_year: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id: string;
          course_id: string;
          name: string;
          academic_year: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string;
          course_id?: string;
          name?: string;
          academic_year?: string;
          created_at?: string;
        };
      };
      enrollments: {
        Row: {
          id: string;
          class_id: string;
          student_id: string;
          enrolled_at: string;
          status: 'active' | 'completed' | 'dropped';
        };
        Insert: {
          id?: string;
          class_id: string;
          student_id: string;
          enrolled_at?: string;
          status?: 'active' | 'completed' | 'dropped';
        };
        Update: {
          id?: string;
          class_id?: string;
          student_id?: string;
          enrolled_at?: string;
          status?: 'active' | 'completed' | 'dropped';
        };
      };
      parent_student_links: {
        Row: {
          id: string;
          parent_id: string;
          student_id: string;
          relationship: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          parent_id: string;
          student_id: string;
          relationship?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          parent_id?: string;
          student_id?: string;
          relationship?: string;
          created_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          school_id: string | null;
          user_id: string | null;
          action: string;
          entity: string;
          entity_id: string | null;
          metadata: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          school_id?: string | null;
          user_id?: string | null;
          action: string;
          entity: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          school_id?: string | null;
          user_id?: string | null;
          action?: string;
          entity?: string;
          entity_id?: string | null;
          metadata?: Json | null;
          created_at?: string;
        };
      };
      materials: {
        Row: {
          id: string;
          class_id: string | null;
          teacher_id: string | null;
          title: string;
          file_type: string;
          file_url: string;
          description: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id?: string | null;
          teacher_id?: string | null;
          title: string;
          file_type: string;
          file_url: string;
          description?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string | null;
          teacher_id?: string | null;
          title?: string;
          file_type?: string;
          file_url?: string;
          description?: string | null;
          created_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          class_id: string | null;
          teacher_id: string | null;
          title: string;
          description: string | null;
          due_date: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          class_id?: string | null;
          teacher_id?: string | null;
          title: string;
          description?: string | null;
          due_date?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          class_id?: string | null;
          teacher_id?: string | null;
          title?: string;
          description?: string | null;
          due_date?: string | null;
          created_at?: string;
        };
      };
      submissions: {
        Row: {
          id: string;
          assignment_id: string;
          student_id: string;
          file_url: string | null;
          notes: string | null;
          grade: number | null;
          feedback: string | null;
          submitted_at: string;
        };
        Insert: {
          id?: string;
          assignment_id: string;
          student_id: string;
          file_url?: string | null;
          notes?: string | null;
          grade?: number | null;
          feedback?: string | null;
          submitted_at?: string;
        };
        Update: {
          id?: string;
          assignment_id?: string;
          student_id?: string;
          file_url?: string | null;
          notes?: string | null;
          grade?: number | null;
          feedback?: string | null;
          submitted_at?: string;
        };
      };
      attendance_records: {
        Row: {
          id: string;
          student_id: string | null;
          profile_id: string | null;
          school_id: string | null;
          class_id: string | null;
          qr_code: string | null;
          attendance_type: string;
          session: string;
          session_id: string | null;
          status: string;
          scanned_at: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          student_id?: string | null;
          profile_id?: string | null;
          school_id?: string | null;
          class_id?: string | null;
          qr_code?: string | null;
          attendance_type?: string;
          session?: string;
          session_id?: string | null;
          status?: string;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          student_id?: string | null;
          profile_id?: string | null;
          school_id?: string | null;
          class_id?: string | null;
          qr_code?: string | null;
          attendance_type?: string;
          session?: string;
          session_id?: string | null;
          status?: string;
          scanned_at?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}
