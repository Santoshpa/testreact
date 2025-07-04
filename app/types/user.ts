export interface User {
  id: string
  firstName: string
  lastName: string
  email: string
  role: string
  company?: string
  phone: string
  status: string
  dateCreated: string
}

export interface UserFormData {
  firstName: string
  lastName: string
  email: string
  role: string
  status: string
  company: string
  phone: string
  password: string
  confirmPassword: string
  address: string
  city: string
  state: string
  zipCode: string
  country: string
  commission: number
}
