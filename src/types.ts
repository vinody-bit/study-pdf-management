export type PdfRecord = {
  id: string;
  title: string;
  subject: string;
  description: string | null;
  file_path: string;
  file_name: string;
  file_size: number;
  uploaded_by: string | null;
  created_at: string;
  updated_at: string;
};

export type Profile = {
  id: string;
  email: string | null;
  role: 'admin' | 'user';
  created_at: string;
};
