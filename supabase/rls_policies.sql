-- EduVerse LMS Row Level Security (RLS) Policies
-- Strict multi-tenant isolation and 5-role authorization matrix

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper Function: Get current authenticated user role
CREATE OR REPLACE FUNCTION public.get_auth_user_role()
RETURNS user_role AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Helper Function: Check if user belongs to a school
CREATE OR REPLACE FUNCTION public.is_school_member(school_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.school_members
    WHERE school_id = school_uuid AND user_id = auth.uid()
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- --------------------------------------------------
-- 1. PROFILES POLICIES
-- --------------------------------------------------
-- Users can view their own profile
CREATE POLICY "Profiles self view" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR public.get_auth_user_role() = 'super_admin');

-- School admins can view profiles of users in their school
CREATE POLICY "Profiles school admin view" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.school_members sm_admin
      JOIN public.school_members sm_target ON sm_admin.school_id = sm_target.school_id
      WHERE sm_admin.user_id = auth.uid()
        AND sm_admin.role = 'school_admin'
        AND sm_target.user_id = public.profiles.id
    )
  );

-- Users can update their own non-role profile fields
CREATE POLICY "Profiles self update" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- --------------------------------------------------
-- 2. SCHOOLS POLICIES
-- --------------------------------------------------
-- Super admin has full control over schools
CREATE POLICY "Schools super admin all" ON public.schools
  FOR ALL USING (public.get_auth_user_role() = 'super_admin');

-- School members can view their own school
CREATE POLICY "Schools member view" ON public.schools
  FOR SELECT USING (public.is_school_member(id));

-- --------------------------------------------------
-- 3. COURSES POLICIES
-- --------------------------------------------------
-- Super admin can access all courses
CREATE POLICY "Courses super admin all" ON public.courses
  FOR ALL USING (public.get_auth_user_role() = 'super_admin');

-- School admins can manage courses in their school
CREATE POLICY "Courses school admin manage" ON public.courses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.school_members
      WHERE school_id = public.courses.school_id
        AND user_id = auth.uid()
        AND role = 'school_admin'
    )
  );

-- Teachers can manage their assigned courses
CREATE POLICY "Courses teacher manage" ON public.courses
  FOR ALL USING (teacher_id = auth.uid());

-- Students can view published courses in their school
CREATE POLICY "Courses student view" ON public.courses
  FOR SELECT USING (
    is_published = TRUE AND public.is_school_member(school_id)
  );

-- --------------------------------------------------
-- 4. PARENT-STUDENT LINK POLICIES
-- --------------------------------------------------
-- Parents can view their linked students
CREATE POLICY "Parent student link parent view" ON public.parent_student_links
  FOR SELECT USING (parent_id = auth.uid() OR public.get_auth_user_role() = 'super_admin');

-- School admins can manage parent-student links in their school
CREATE POLICY "Parent student link school admin manage" ON public.parent_student_links
  FOR ALL USING (
    public.get_auth_user_role() IN ('super_admin', 'school_admin')
  );

-- --------------------------------------------------
-- 5. AUDIT LOGS POLICIES
-- --------------------------------------------------
-- Super admin can view all audit logs
CREATE POLICY "Audit logs super admin view" ON public.audit_logs
  FOR SELECT USING (public.get_auth_user_role() = 'super_admin');

-- School admin can view audit logs for their school
CREATE POLICY "Audit logs school admin view" ON public.audit_logs
  FOR SELECT USING (
    school_id IS NOT NULL AND public.is_school_member(school_id) AND public.get_auth_user_role() = 'school_admin'
  );
