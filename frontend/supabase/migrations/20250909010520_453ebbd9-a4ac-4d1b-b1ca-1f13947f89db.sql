-- Create user profiles table
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('student', 'parent', 'faculty', 'warden', 'admin')),
  student_id TEXT,
  parent_of_student_id TEXT,
  department TEXT,
  class_section TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_id TEXT NOT NULL UNIQUE,
  roll_number TEXT NOT NULL,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own data" 
ON public.students 
FOR SELECT 
USING (auth.uid() = user_id);

-- Create attendance table
CREATE TABLE public.attendance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(student_id),
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('present', 'absent', 'late')),
  subject TEXT,
  marked_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own attendance" 
ON public.attendance 
FOR SELECT 
USING (student_id IN (SELECT student_id FROM public.students WHERE user_id = auth.uid()));

-- Create marks table
CREATE TABLE public.marks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(student_id),
  subject TEXT NOT NULL,
  exam_type TEXT NOT NULL,
  marks_obtained INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  exam_date DATE NOT NULL,
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.marks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own marks" 
ON public.marks 
FOR SELECT 
USING (student_id IN (SELECT student_id FROM public.students WHERE user_id = auth.uid()));

-- Create timetable table
CREATE TABLE public.timetable (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  class TEXT NOT NULL,
  section TEXT NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 1 AND 7),
  period INTEGER NOT NULL,
  subject TEXT NOT NULL,
  teacher_name TEXT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.timetable ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their class timetable" 
ON public.timetable 
FOR SELECT 
USING (
  (class, section) IN (
    SELECT s.class, s.section 
    FROM public.students s 
    WHERE s.user_id = auth.uid()
  )
);

-- Create fees table
CREATE TABLE public.fees (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id TEXT NOT NULL REFERENCES public.students(student_id),
  fee_type TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue')),
  academic_year TEXT NOT NULL DEFAULT '2024-25',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.fees ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own fees" 
ON public.fees 
FOR SELECT 
USING (student_id IN (SELECT student_id FROM public.students WHERE user_id = auth.uid()));

-- Insert sample data for testing
-- Note: This will be inserted after user registration, but adding some sample structure

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();