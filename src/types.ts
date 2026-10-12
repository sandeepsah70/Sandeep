export interface SubmissionFormData {
  name: string;
  phone: string;
}

export interface FormErrors {
  name?: string;
  phone?: string;
}

export interface SubmissionRecord {
  id?: string;
  name: string;
  phone: string;
  created_at?: string;
}
