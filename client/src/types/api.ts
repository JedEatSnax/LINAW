export interface User {
  id: number
  email: string
  name: string
  occupation: string
  status: string
  created_at: string
  updated_at: string
}

export interface License {
  id: number
  name: string
  product_key: string
  expiration_date?: string
  licensedTo?: User
  licensedToEmail: string
  manufacturer: string
  minimum_quantity?: number
}
